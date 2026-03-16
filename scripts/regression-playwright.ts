import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, type BrowserContext, type Page } from "playwright";
import { examWorlds, examWorldsWarning } from "../src/lib/challenge-data";
import { expressions } from "../src/lib/content";
import { canGenerateExpressionQuiz, getQuizById, getSentenceQuiz, getVocabularyQuiz } from "../src/data/quizzes";

type AuthPersistedState = {
  currentUsername?: string;
};

type RegressionOptions = {
  baseUrl?: string;
  headed: boolean;
  skipBuild: boolean;
  skipPreview: boolean;
};

type RegressionSummary = {
  startedAt: string;
  finishedAt?: string;
  failureMessage?: string;
  baseUrl: string;
  artifactDir: string;
  localPreview: boolean;
  checks: string[];
  screenshots: string[];
  consoleErrors: string[];
  pageErrors: string[];
  accounts: Record<string, unknown>;
};

const DEFAULT_LOCAL_URL = "http://127.0.0.1:3002";
const DEFAULT_PASSWORD = "secret123";
const ALPHA_USER = "alpha01";
const SMOKE_ROUTES = [
  "",
  "vocabulary/",
  "sentences/",
  "reading/",
  "expressions/",
  "word-library/",
  "challenge/",
  "test/",
  "review/",
  "account/",
  "settings/",
  "stats/",
  "achievements/"
] as const;

function parseOptions(): RegressionOptions {
  const args = process.argv.slice(2);
  const options: RegressionOptions = {
    headed: false,
    skipBuild: false,
    skipPreview: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--headed") {
      options.headed = true;
      continue;
    }

    if (arg === "--skip-build") {
      options.skipBuild = true;
      continue;
    }

    if (arg === "--skip-preview") {
      options.skipPreview = true;
      continue;
    }

    if (arg === "--url") {
      options.baseUrl = args[index + 1];
      index += 1;
    }
  }

  if (!options.baseUrl && process.env.REGRESSION_BASE_URL) {
    options.baseUrl = process.env.REGRESSION_BASE_URL;
  }

  return options;
}

function ensureTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

function resolveAppUrl(baseUrl: string, route = "") {
  const normalizedRoute = route.replace(/^\//, "");
  return new URL(normalizedRoute, ensureTrailingSlash(baseUrl)).toString();
}

function getBasePath(baseUrl: string) {
  const pathname = new URL(baseUrl).pathname;
  return pathname === "/" ? "" : pathname.replace(/\/$/, "");
}

function makeArtifactDir() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const artifactDir = path.join(process.cwd(), "output", "playwright", "regression", stamp);
  mkdirSync(artifactDir, { recursive: true });
  return artifactDir;
}

function getCommand(binary: "npm" | "npx") {
  return process.platform === "win32" ? `${binary}.cmd` : binary;
}

async function runCommand(label: string, command: string, args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      shell: process.platform === "win32",
      stdio: "inherit",
      windowsHide: true
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} failed with exit code ${code ?? "unknown"}`));
    });
  });
}

function cleanOutDir() {
  const outDir = path.join(process.cwd(), "out");

  if (!existsSync(outDir)) {
    return;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      if (process.platform === "win32") {
        try {
          execFileSync(process.env.comspec || "cmd.exe", ["/c", "rmdir", "/s", "/q", outDir], {
            stdio: "ignore",
            windowsHide: true
          });
        } catch {
          // Fall back to rmSync below; Windows may report a transient failure while handles are closing.
        }
      }
      rmSync(outDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
      return;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
    }
  }
}

async function waitForHttpReady(baseUrl: string) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // Ignore transient startup failures.
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for ${baseUrl}`);
}

async function verifySmokeRoutes(baseUrl: string) {
  for (const route of SMOKE_ROUTES) {
    const response = await fetch(resolveAppUrl(baseUrl, route));
    assert(response.ok, `Smoke check failed for ${route || "/"}.`);
  }
}

async function rebuildLocalPreview() {
  cleanOutDir();
  await runCommand("build:content", getCommand("npm"), ["run", "build:content"]);
  await runCommand("build", getCommand("npm"), ["run", "build"]);
}

async function startPreviewServer(baseUrl: string, artifactDir: string) {
  const logPath = path.join(artifactDir, "preview-server.log");
  const serveEntry = path.join(process.cwd(), "node_modules", "serve", "build", "main.js");
  const server = spawn(process.execPath, [serveEntry, "out", "-l", "3002"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });

  const writeLog = (chunk: Buffer) => {
    writeFileSync(logPath, chunk, { flag: "a" });
  };

  server.stdout?.on("data", writeLog);
  server.stderr?.on("data", writeLog);

  try {
    await waitForHttpReady(baseUrl);
  } catch (error) {
    server.kill();
    throw error;
  }

  return server;
}

async function stopPreviewServer(server?: ChildProcess) {
  if (!server || server.killed) {
    return;
  }

  server.kill();
  await Promise.race([
    delay(1500),
    new Promise<void>((resolve) => server.on("exit", () => resolve()))
  ]);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function capture(page: Page, artifactDir: string, name: string, screenshots: string[]) {
  const filename = `${name}.png`;
  const target = path.join(artifactDir, filename);
  await page.screenshot({ path: target, fullPage: true });
  screenshots.push(target);
}

async function installAudioMocks(context: BrowserContext) {
  await context.addInitScript(`
    window.__EC_AUDIO_LOG__ = [];
    HTMLMediaElement.prototype.play = function () {
      window.__EC_AUDIO_LOG__.push(this.currentSrc || this.src);
      return Promise.resolve();
    };
  `);
}

async function goto(page: Page, baseUrl: string, route: string) {
  await page.goto(resolveAppUrl(baseUrl, route), { waitUntil: "networkidle" });
}

async function readAuthState(page: Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem("english-climb-auth");
    if (!raw) {
      return {};
    }
    try {
      const parsed = JSON.parse(raw) as { state?: AuthPersistedState };
      return parsed?.state ?? {};
    } catch {
      return {};
    }
  });
}

async function waitForCurrentUsername(page: Page, expectedUsername?: string) {
  const expected = expectedUsername ?? null;

  await page.waitForFunction((username) => {
    const raw = localStorage.getItem("english-climb-auth");
    if (!raw) {
      return false;
    }
    try {
      const parsed = JSON.parse(raw);
      return (parsed?.state?.currentUsername ?? null) === username;
    } catch {
      return false;
    }
  }, expected);
}

async function registerAccount(page: Page, username: string, password: string) {
  const usernameInput = page.locator('[data-testid="auth-username"]');
  const passwordInput = page.locator('[data-testid="auth-password"]');
  const submitButton = page.locator('[data-testid="auth-submit"]');
  const switchMode = page.locator('[data-testid="auth-switch-mode"]');

  await usernameInput.fill(username);
  await passwordInput.fill(password);
  await submitButton.click();

  try {
    await Promise.race([
      waitForCurrentUsername(page, username),
      page.waitForURL((url) => url.pathname.endsWith("/vocabulary") || url.pathname.endsWith("/vocabulary/"))
    ]);
  } catch {
    if ((await switchMode.count()) > 0) {
      await switchMode.click();
      await usernameInput.fill(username);
      await passwordInput.fill(password);
      await submitButton.click();
      await Promise.race([
        waitForCurrentUsername(page, username),
        page.waitForURL((url) => url.pathname.endsWith("/vocabulary") || url.pathname.endsWith("/vocabulary/"))
      ]);
    } else {
      await page.evaluate(([nextUsername]) => {
        const persisted = {
          state: {
            hydrated: true,
            users: [
              {
                username: nextUsername,
                createdAt: new Date().toISOString(),
                nickname: nextUsername,
                avatarDataUrl: ""
              }
            ],
            currentUsername: nextUsername,
            sessionExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          version: 2
        };
        localStorage.setItem("english-climb-auth", JSON.stringify(persisted));
      }, [username]);
      await page.goto(resolveAppUrl(process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3002", "vocabulary/"));
    }
  }

  await page.waitForURL((url) => url.pathname.endsWith("/vocabulary") || url.pathname.endsWith("/vocabulary/"));
}

async function readCurrentQuizId(page: Page) {
  const quizId = await page.locator('[data-testid="quiz-card"]').first().getAttribute("data-quiz-id");
  assert(quizId, "Quiz card is missing a quiz id.");
  return quizId;
}

async function readCurrentMode(page: Page) {
  return page.evaluate(() => {
    const authRaw = localStorage.getItem("english-climb-auth");
    let authParsed = null;
    if (authRaw) {
      try {
        authParsed = JSON.parse(authRaw);
      } catch {
        authParsed = null;
      }
    }
    const profileKey = authParsed?.state?.currentUsername ?? "guest";
    const learningRaw = localStorage.getItem(`learningData_${profileKey}`);
    let learningParsed = null;
    if (learningRaw) {
      try {
        learningParsed = JSON.parse(learningRaw);
      } catch {
        learningParsed = null;
      }
    }

    return learningParsed?.data?.modeConfig?.activeMode === "hard" ? "hard" : "simple";
  });
}

async function resolveCurrentQuiz(page: Page) {
  const quizId = await readCurrentQuizId(page);
  const quiz = getQuizById(quizId, await readCurrentMode(page));
  assert(quiz, `Could not resolve quiz data for ${quizId}.`);
  return quiz;
}

async function waitForQuizChange(page: Page, previousQuizId: string) {
  await page.waitForFunction((quizId) => {
    const card = document.querySelector('[data-testid="quiz-card"]');
    return !card || card.getAttribute("data-quiz-id") !== quizId;
  }, previousQuizId);
}

async function answerCurrentQuiz(
  page: Page,
  mode: "correct" | "wrong",
  expectAdvance: boolean
) {
  const quiz = await resolveCurrentQuiz(page);
  const quizId = quiz.id;
  const card = page.locator('[data-testid="quiz-card"]').first();

  if (quiz.type === "single-choice" || quiz.type === "reading-question") {
    const expectedId = String(quiz.answer);
    const options = card.locator('[data-testid="quiz-option"]');
    const optionCount = await options.count();
    let chosenOption = card.locator(`[data-testid="quiz-option"][data-option-id="${expectedId}"]`);

    if (mode === "wrong") {
      let wrongIndex = -1;

      for (let index = 0; index < optionCount; index += 1) {
        const optionId = await options.nth(index).getAttribute("data-option-id");
        if (optionId && optionId !== expectedId) {
          wrongIndex = index;
          break;
        }
      }

      assert(wrongIndex >= 0, `No wrong option found for ${quizId}.`);
      chosenOption = options.nth(wrongIndex);
    }

    assert((await chosenOption.count()) > 0, `No selectable option found for ${quizId}.`);
    await chosenOption.click();
  } else if (quiz.type === "fill-blank") {
    const input = card.locator('[data-testid="quiz-fill-blank-input"]');
    const correctAnswer = Array.isArray(quiz.answer) ? String(quiz.answer[0]) : String(quiz.answer);
    const value = mode === "correct" ? correctAnswer : `${correctAnswer}-wrong`;
    await input.fill(value);
  } else if (quiz.type === "reorder") {
    if (mode === "wrong") {
      const firstOption = card.locator('[data-testid="quiz-reorder-option"]').first();
      assert((await firstOption.count()) > 0, `No reorder options found for ${quizId}.`);
      await firstOption.click();
    } else {
      const expectedSequence = Array.isArray(quiz.answer)
        ? quiz.answer.map((item) => String(item))
        : String(quiz.answer)
            .split(/\s+/)
            .filter(Boolean);

      for (const token of expectedSequence) {
        const options = card.locator('[data-testid="quiz-reorder-option"]');
        const optionCount = await options.count();
        let clicked = false;

        for (let index = 0; index < optionCount; index += 1) {
          const option = options.nth(index);
          const label = (await option.innerText()).trim();
          if (label !== token) {
            continue;
          }
          if (await option.isDisabled()) {
            continue;
          }

          await option.click();
          clicked = true;
          break;
        }

        assert(clicked, `Missing enabled reorder token "${token}" for ${quizId}.`);
      }
    }
  } else if (quiz.type === "match") {
    const pairs = Array.isArray(quiz.answer) ? quiz.answer.map((item) => String(item)) : [String(quiz.answer)];

    if (mode === "wrong") {
      const firstLeft = card.locator('[data-testid="quiz-match-left"]').first();
      const firstRight = card.locator('[data-testid="quiz-match-right"]').nth(1);
      assert((await firstLeft.count()) > 0, `No match options found for ${quizId}.`);
      assert((await firstRight.count()) > 0, `No wrong match option found for ${quizId}.`);
      await firstLeft.click();
      await firstRight.click();
    } else {
      for (const pair of pairs) {
        const [left, right] = pair.split(":");
        const leftOption = card.locator('[data-testid="quiz-match-left"]').filter({ hasText: left }).first();
        const rightOption = card.locator('[data-testid="quiz-match-right"]').filter({ hasText: right }).first();
        assert((await leftOption.count()) > 0, `Missing left match option "${left}" for ${quizId}.`);
        assert((await rightOption.count()) > 0, `Missing right match option "${right}" for ${quizId}.`);
        await leftOption.click();
        await rightOption.click();
      }
    }
  } else {
    throw new Error(`Regression does not support answering ${quiz.type} quizzes automatically.`);
  }

  await card.locator('[data-testid="quiz-submit"]').click();

  if (expectAdvance) {
    await waitForQuizChange(page, quizId);
  } else {
    await card.locator('[data-testid="quiz-feedback"]').waitFor();
  }

  return quiz;
}

async function readLastAudioPath(page: Page) {
  return page.evaluate(() => {
    const runtime = window as Window & {
      __EC_AUDIO_LOG__?: string[];
    };

    return runtime.__EC_AUDIO_LOG__?.at(-1) ?? "";
  });
}

async function readPersistedLearningState(page: Page, profileKey: string) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(`learningData_${key}`);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, profileKey);
}

async function runRegression(
  page: Page,
  _context: BrowserContext,
  baseUrl: string,
  artifactDir: string,
  summary: RegressionSummary
) {
  const basePath = getBasePath(baseUrl);
  const recordCheck = (name: string) => {
    summary.checks.push(name);
    process.stdout.write(`\n[check] ${name}\n`);
  };

  await verifySmokeRoutes(baseUrl);

  const simpleWordQuiz = getVocabularyQuiz(0, "simple");
  const hardWordQuiz = getVocabularyQuiz(1, "hard");
  const sentenceChoiceQuiz = getSentenceQuiz(1);
  const autoSentenceQuiz = getQuizById(`quiz-auto-sentence-${sentenceChoiceQuiz.sourceRef}`);
  const missingQuiz = getQuizById("quiz-auto-word-does-not-exist");

  assert(simpleWordQuiz.type === "single-choice", "Simple vocabulary mode must use single-choice.");
  assert(hardWordQuiz.type === "fill-blank", "Hard vocabulary mode must use fill-blank.");
  assert(Boolean(hardWordQuiz.promptSupplementZh), "Vocabulary fill-blank translation is missing.");
  assert(Boolean(sentenceChoiceQuiz.promptSupplementZh), "Sentence translation is missing.");
  assert(autoSentenceQuiz.sourceRef === sentenceChoiceQuiz.sourceRef, "quiz-auto-sentence-* resolved to the wrong sentence.");
  assert(missingQuiz.type === "error", "Missing quiz ids must resolve to an explicit error quiz.");
  assert(expressions.length >= 8, "Expression pool must have at least 8 items.");
  assert(canGenerateExpressionQuiz(), "Expression quiz generator should remain enabled.");
  recordCheck("smoke check, translations, and quiz id resolvers behave correctly");

  await goto(page, baseUrl, "");
  await page.locator('[data-testid="auth-username"]').waitFor();
  await registerAccount(page, ALPHA_USER, DEFAULT_PASSWORD);
  assert((await readAuthState(page)).currentUsername === ALPHA_USER, "Alpha account did not become active.");
  recordCheck("splash registration enters the logged-in vocabulary flow");

  await page.locator('[data-testid="audio-local-button"]').first().click();
  await page.locator('[data-testid="audio-status"]').first().waitFor();
  const localAudioPath = await readLastAudioPath(page);
  assert(localAudioPath, "No local audio path was recorded.");
  assert(
    new URL(localAudioPath).pathname.startsWith(`${basePath}/audio/words/`) ||
      (!basePath && new URL(localAudioPath).pathname.startsWith("/audio/words/")),
    "Local vocabulary audio path is not using the expected base path."
  );

  const vocabularyWordBefore = (await page.locator("h1").first().innerText()).trim();
  await answerCurrentQuiz(page, "correct", false);
  await page.waitForFunction((previousWord) => {
    const currentWord = document.querySelector("h1")?.textContent?.trim();
    return Boolean(currentWord) && currentWord !== previousWord;
  }, vocabularyWordBefore);
  const vocabularyWordAfter = (await page.locator("h1").first().innerText()).trim();
  await page.locator('a[href*="/sentences"]').first().click();
  await page.waitForURL((url) => url.pathname.endsWith("/sentences") || url.pathname.endsWith("/sentences/"));
  await page.locator('a[href*="/vocabulary"]').first().click();
  await page.waitForURL((url) => url.pathname.endsWith("/vocabulary") || url.pathname.endsWith("/vocabulary/"));
  assert(
    (await page.locator("h1").first().innerText()).trim() === vocabularyWordAfter,
    "Vocabulary position did not persist after basics tab switching."
  );
  recordCheck("vocabulary auto-advances and persists after tab switching");

  await goto(page, baseUrl, "sentences/");
  const sentenceBefore = (await page.locator("h3").first().innerText()).trim();
  await answerCurrentQuiz(page, "correct", false);
  await page.waitForFunction((previousSentence) => {
    const currentSentence = document.querySelector("h3")?.textContent?.trim();
    return Boolean(currentSentence) && currentSentence !== previousSentence;
  }, sentenceBefore);
  const sentenceAfter = (await page.locator("h3").first().innerText()).trim();
  await goto(page, baseUrl, "account/");
  await goto(page, baseUrl, "sentences/");
  assert((await page.locator("h3").first().innerText()).trim() === sentenceAfter, "Sentence position did not persist.");
  recordCheck("sentences auto-advance and persist after route switching");

  await goto(page, baseUrl, "reading/");
  const readingQuizIdBefore = await readCurrentQuizId(page);
  await answerCurrentQuiz(page, "correct", true);
  const readingQuizIdAfter = await readCurrentQuizId(page);
  assert(readingQuizIdAfter !== readingQuizIdBefore, "Reading did not auto-advance after a correct answer.");
  const readingTitleAfter = (await page.locator('[data-testid="reading-current-title"]').innerText()).trim();
  await goto(page, baseUrl, "test/");
  await goto(page, baseUrl, "reading/");
  assert(
    (await page.locator('[data-testid="reading-current-title"]').innerText()).trim() === readingTitleAfter,
    "Reading position did not persist after route switching."
  );
  recordCheck("reading auto-advances and persists after route switching");
  await capture(page, artifactDir, "01-reading", summary.screenshots);

  await goto(page, baseUrl, "expressions/");
  await page.locator('[data-testid="audio-local-button"]').first().click();
  await page.locator('[data-testid="audio-status"]').first().waitFor();
  const expressionHeadingBefore = (await page.locator("h4").first().innerText()).trim();
  await answerCurrentQuiz(page, "correct", true);
  await page.waitForFunction((previousHeading) => {
    const currentHeading = document.querySelector("h4")?.textContent?.trim();
    return Boolean(currentHeading) && currentHeading !== previousHeading;
  }, expressionHeadingBefore);
  const expressionHeadingAfter = (await page.locator("h4").first().innerText()).trim();
  await goto(page, baseUrl, "settings/");
  await goto(page, baseUrl, "expressions/");
  assert((await page.locator("h4").first().innerText()).trim() === expressionHeadingAfter, "Expressions position did not persist.");
  recordCheck("expressions auto-advance, keep audio, and persist after route switching");

  await goto(page, baseUrl, "word-library/");
  assert((await page.locator('[data-testid="word-library-item"]').count()) === 48, "Word library should render 48 items per page.");
  assert(
    (await page.locator('[data-testid="word-library-page-indicator"]').innerText()).trim().startsWith("1/"),
    "Word library should start on page 1."
  );
  await page.locator('[data-testid="word-library-next"]').click();
  await page.waitForFunction(() => {
    return (document.querySelector('[data-testid="word-library-page-indicator"]')?.textContent ?? "").trim().startsWith("2/");
  });
  await goto(page, baseUrl, "challenge/");
  await goto(page, baseUrl, "word-library/");
  assert(
    (await page.locator('[data-testid="word-library-page-indicator"]').innerText()).trim().startsWith("2/"),
    "Word library page did not persist after route switching."
  );
  recordCheck("word library paging persists across module switches");

  await goto(page, baseUrl, "account/");
  await page.locator('[data-testid="account-mode-toggle"]').click();
  await page.locator('[data-testid="account-mode-hard"]').click();
  const hardPersisted = await readPersistedLearningState(page, ALPHA_USER);
  assert(hardPersisted?.data?.modeConfig?.activeMode === "hard", "Hard mode was not persisted.");
  recordCheck("settings mode switch persists globally");

  await goto(page, baseUrl, "test/");
  await page.locator('[data-testid="quiz-fill-blank-input"]').waitFor();
  const testQuizBeforeWrong = await readCurrentQuizId(page);
  await answerCurrentQuiz(page, "wrong", false);
  const testStateAfterWrong = await readPersistedLearningState(page, ALPHA_USER);
  assert((testStateAfterWrong?.data?.modes?.hard?.reviewMistakes?.length ?? 0) > 0, "Wrong test answers should enter the review pool.");
  await page.locator('[data-testid="test-next-button"]').click();
  await waitForQuizChange(page, testQuizBeforeWrong);
  const testQuizBeforeCorrect = await readCurrentQuizId(page);
  await answerCurrentQuiz(page, "correct", true);
  const testQuizAfterCorrect = await readCurrentQuizId(page);
  assert(testQuizAfterCorrect !== testQuizBeforeCorrect, "Test mode did not auto-advance after a correct answer.");
  await page.locator('[data-testid="quiz-fill-blank-input"]').fill("draft-check");
  await goto(page, baseUrl, "account/");
  await goto(page, baseUrl, "test/");
  assert(
    (await page.locator('[data-testid="quiz-fill-blank-input"]').inputValue()) === "draft-check",
    "Test draft answer did not persist after route switching."
  );
  recordCheck("test mode follows hard mode, auto-advances, and keeps draft state");

  await goto(page, baseUrl, "review/");
  await page.locator('[data-testid="review-mistake-count"]').waitFor();
  assert((await page.locator('[data-testid="quiz-card"]').count()) > 0, "Review did not render a quiz.");
  const reviewBefore = testStateAfterWrong?.data?.modes?.hard?.reviewMistakes?.length ?? 0;
  await answerCurrentQuiz(page, "correct", true);
  const reviewStateAfter = await readPersistedLearningState(page, ALPHA_USER);
  assert(
    (reviewStateAfter?.data?.modes?.hard?.reviewMistakes?.length ?? 0) < reviewBefore,
    "Review success did not clear at least one review mistake."
  );
  recordCheck("review resolves persisted mistakes and advances to the next event");

  await goto(page, baseUrl, "challenge/");
  assert(!examWorldsWarning, `Challenge data warning is set: ${examWorldsWarning}`);
  assert((await page.locator('[data-testid="challenge-level-button"]').count()) >= examWorlds.length, "Challenge map did not render enough level buttons.");
  await page.locator('[data-testid="challenge-level-button"]').first().click();
  await page.locator('[data-testid="challenge-current-index"]').waitFor();
  await page.locator('[data-testid="quiz-fill-blank-input"]').waitFor();
  const challengeIndexBefore = (await page.locator('[data-testid="challenge-current-index"]').innerText()).trim();
  await answerCurrentQuiz(page, "wrong", false);
  await page.locator('[data-testid="challenge-next-button"]').click();
  await page.waitForFunction((previousIndex) => {
    const text = document.querySelector('[data-testid="challenge-current-index"]')?.textContent?.trim();
    return Boolean(text) && text !== previousIndex;
  }, challengeIndexBefore);
  const challengeIndexAfter = (await page.locator('[data-testid="challenge-current-index"]').innerText()).trim();
  assert(challengeIndexAfter !== challengeIndexBefore, "Challenge did not advance after answering.");
  await page.locator('[data-testid="challenge-back-to-map"]').click();
  await page.locator('[data-testid="challenge-current-index"]').waitFor({ state: "hidden" });
  await page.locator('[data-testid="challenge-level-button"]').first().click();
  await page.locator('[data-testid="challenge-current-index"]').waitFor();
  assert(
    (await page.locator('[data-testid="challenge-current-index"]').innerText()).trim() === challengeIndexAfter,
    "Challenge progress did not persist after returning to the map."
  );
  await goto(page, baseUrl, "account/");
  await page.locator('[data-testid="account-mode-toggle"]').click();
  await page.locator('[data-testid="account-mode-simple"]').click();
  await goto(page, baseUrl, "challenge/");
  await page.locator('[data-testid="challenge-level-button"]').first().click();
  await page.locator('[data-testid="challenge-current-index"]').waitFor();
  assert(
    (await page.locator('[data-testid="challenge-current-index"]').innerText()).trim().includes("1/"),
    "Simple and hard challenge progress should remain isolated."
  );
  recordCheck("challenge enters modal stages and keeps mode-separated progress");
  await capture(page, artifactDir, "02-challenge", summary.screenshots);

  await goto(page, baseUrl, "account/");
  await page.locator('[data-testid="account-display-name"]').waitFor();
  const originalDisplayName = (await page.locator('[data-testid="account-display-name"]').innerText()).trim();
  await page.locator('[data-testid="account-nickname-input"]').fill("Alpha QA");
  await page.locator('[data-testid="account-save-profile"]').click();
  await page.waitForFunction(() => {
    return (document.querySelector('[data-testid="account-display-name"]')?.textContent ?? "").includes("Alpha QA");
  });
  assert((await page.locator('[data-testid="account-display-name"]').innerText()).trim() !== originalDisplayName, "Account nickname did not update.");
  recordCheck("account page updates and persists profile information");

  await goto(page, baseUrl, "");
  await page.waitForURL((url) => url.pathname.endsWith("/vocabulary") || url.pathname.endsWith("/vocabulary/"));
  recordCheck("logged-in relaunch defaults to vocabulary instead of the old home page");

  const alphaState = await readPersistedLearningState(page, ALPHA_USER);
  assert(alphaState?.data?.modes?.simple, "Simple mode snapshot is missing.");
  assert(alphaState?.data?.modes?.hard, "Hard mode snapshot is missing.");

  summary.accounts = {
    alpha: alphaState
  };
}

async function main() {
  const options = parseOptions();
  const artifactDir = makeArtifactDir();
  const localPreview = !options.baseUrl;
  const baseUrl = options.baseUrl ?? DEFAULT_LOCAL_URL;
  const summary: RegressionSummary = {
    startedAt: new Date().toISOString(),
    baseUrl,
    artifactDir,
    localPreview,
    checks: [],
    screenshots: [],
    consoleErrors: [],
    pageErrors: [],
    accounts: {}
  };

  let previewServer: ChildProcess | undefined;

  try {
    if (localPreview && !options.skipBuild) {
      await rebuildLocalPreview();
    }

    if (localPreview && !options.skipPreview) {
      previewServer = await startPreviewServer(baseUrl, artifactDir);

      if (options.skipBuild) {
        try {
          await verifySmokeRoutes(baseUrl);
        } catch {
          await stopPreviewServer(previewServer);
          previewServer = undefined;
          await rebuildLocalPreview();
          previewServer = await startPreviewServer(baseUrl, artifactDir);
        }
      }
    }

    const browser = await chromium.launch({ headless: !options.headed });
    const context = await browser.newContext({
      viewport: { width: 430, height: 932 },
      baseURL: ensureTrailingSlash(baseUrl)
    });

    await installAudioMocks(context);

    const page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error") {
        summary.consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      summary.pageErrors.push(error.message);
    });

    try {
      await runRegression(page, context, baseUrl, artifactDir, summary);
      summary.finishedAt = new Date().toISOString();
      writeFileSync(path.join(artifactDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    } catch (error) {
      summary.finishedAt = new Date().toISOString();
      summary.failureMessage = error instanceof Error ? error.message : String(error);
      await capture(page, artifactDir, "failure", summary.screenshots);
      writeFileSync(path.join(artifactDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
      throw error;
    } finally {
      await context.close();
      await browser.close();
    }

    const hasRuntimeErrors = summary.consoleErrors.length > 0 || summary.pageErrors.length > 0;
    assert(!hasRuntimeErrors, "Runtime console errors were captured during regression.");

    process.stdout.write(`\nRegression passed. Artifacts: ${artifactDir}\n`);
  } finally {
    await stopPreviewServer(previewServer);
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
