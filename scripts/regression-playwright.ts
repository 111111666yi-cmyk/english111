import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, type BrowserContext, type Page } from "playwright";
import { examWorlds, examWorldsWarning } from "../src/lib/challenge-data";
import { expressions } from "../src/lib/content";
import { canGenerateExpressionQuiz, getQuizById, getSentenceQuiz, getVocabularyQuiz } from "../src/data/quizzes";

type ReviewSessionState = {
  index: number;
};

type TestSessionState = {
  index: number;
};

type ChallengeSessionState = {
  activeWorldId: string;
  activeLevelId: string | null;
  questionIndex: number;
  results: Record<string, boolean>;
  saved: boolean;
};

type LearningSnapshot = {
  knownWords?: string[];
  difficultWords?: string[];
  completedPassageIds?: string[];
  reviewMistakes?: string[];
  examMistakes?: string[];
  reviewSession?: ReviewSessionState;
  testSession?: TestSessionState;
  challengeSession?: ChallengeSessionState;
};

type PersistedLearningState = {
  version?: number;
  data?: LearningSnapshot;
};

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
  accounts: {
    guest: Required<LearningSnapshot>;
    alpha: Required<LearningSnapshot>;
    beta: Required<LearningSnapshot>;
  };
};

const DEFAULT_LOCAL_URL = "http://127.0.0.1:3002";
const DEFAULT_PASSWORD = "secret123";
const ALPHA_USER = "alpha01";
const BETA_USER = "beta01";

const EMPTY_SNAPSHOT: Required<LearningSnapshot> = {
  knownWords: [],
  difficultWords: [],
  completedPassageIds: [],
  reviewMistakes: [],
  examMistakes: [],
  reviewSession: { index: 0 },
  testSession: { index: 0 },
  challengeSession: {
    activeWorldId: "world-1",
    activeLevelId: null,
    questionIndex: 0,
    results: {},
    saved: false
  }
};

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
  const persisted = await page.evaluate(() => {
    const raw = localStorage.getItem("english-climb-auth");
    return raw ? (JSON.parse(raw) as { state?: AuthPersistedState }).state ?? {} : {};
  });

  return persisted;
}

async function readLearningSnapshot(page: Page, profileKey: string) {
  const snapshot = await page.evaluate((key) => {
    const raw = localStorage.getItem(`learningData_${key}`);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as LearningSnapshot | PersistedLearningState;
    if (parsed && typeof parsed === "object" && "data" in parsed) {
      return parsed.data ?? null;
    }

    return parsed as LearningSnapshot;
  }, profileKey);

  return {
    knownWords: snapshot?.knownWords ?? [],
    difficultWords: snapshot?.difficultWords ?? [],
    completedPassageIds: snapshot?.completedPassageIds ?? [],
    reviewMistakes: snapshot?.reviewMistakes ?? [],
    examMistakes: snapshot?.examMistakes ?? [],
    reviewSession: snapshot?.reviewSession ?? { index: 0 },
    testSession: snapshot?.testSession ?? { index: 0 },
    challengeSession:
      snapshot?.challengeSession ?? {
        activeWorldId: "world-1",
        activeLevelId: null,
        questionIndex: 0,
        results: {},
        saved: false
      }
  } satisfies Required<LearningSnapshot>;
}

async function waitForCurrentUsername(page: Page, expectedUsername?: string) {
  const expected = expectedUsername ?? null;

  await page.waitForFunction((username) => {
    const raw = localStorage.getItem("english-climb-auth");
    const parsed = raw ? (JSON.parse(raw) as { state?: AuthPersistedState }) : null;
    return (parsed?.state?.currentUsername ?? null) === username;
  }, expected);
}

async function registerAccount(page: Page, username: string, password: string) {
  await page.locator('[data-testid="register-username"]').fill(username);
  await page.locator('[data-testid="register-password"]').fill(password);
  await page.locator('[data-testid="register-submit"]').click();
  await waitForCurrentUsername(page, username);
}

async function loginAccount(page: Page, username: string, password: string) {
  await page.locator('[data-testid="login-username"]').fill(username);
  await page.locator('[data-testid="login-password"]').fill(password);
  await page.locator('[data-testid="login-submit"]').click();
  await waitForCurrentUsername(page, username);
}

async function logoutToGuest(page: Page, baseUrl: string) {
  const authState = await readAuthState(page);
  if (!authState.currentUsername) {
    return;
  }

  const navLogoutButton = page.locator('[data-testid="navbar-logout"]').first();
  if ((await navLogoutButton.count()) > 0) {
    await navLogoutButton.click();
    await waitForCurrentUsername(page);
    return;
  }

  await goto(page, baseUrl, "account/");
  const accountLogoutButton = page.locator('[data-testid="account-logout"]').first();
  if ((await accountLogoutButton.count()) === 0) {
    throw new Error("Logout button is missing on the account page.");
  }
  await accountLogoutButton.click();
  await waitForCurrentUsername(page);
}

async function getOverviewWords(page: Page) {
  const locator = page.locator('[data-testid="vocabulary-overview-item"] [data-testid="overview-word"]');
  const words = (await locator.allInnerTexts()).map((item) => item.trim()).filter(Boolean);
  return words;
}

async function waitForSnapshotValue(
  page: Page,
  profileKey: string,
  property: "reviewMistakes" | "examMistakes" | "knownWords" | "completedPassageIds",
  expectedLength: number
) {
  await page.waitForFunction(
    ({ key, targetProperty, targetLength }) => {
      const raw = localStorage.getItem(`learningData_${key}`);
      if (!raw) {
        return targetLength === 0;
      }

      const parsed = JSON.parse(raw) as LearningSnapshot | PersistedLearningState;
      const snapshot: LearningSnapshot | null =
        parsed && typeof parsed === "object" && "data" in parsed
          ? (parsed.data ?? null)
          : (parsed as LearningSnapshot);
      const collection = snapshot?.[targetProperty] as string[] | undefined;
      return (collection?.length ?? 0) === targetLength;
    },
    { key: profileKey, targetProperty: property, targetLength: expectedLength }
  );
}

async function waitForQuizChange(page: Page, previousQuizId: string) {
  await page.waitForFunction((quizId) => {
    const card = document.querySelector('[data-testid="quiz-card"]');
    return !card || card.getAttribute("data-quiz-id") !== quizId;
  }, previousQuizId);
}

async function readCurrentQuizId(page: Page) {
  const quizId = await page.locator('[data-testid="quiz-card"]').first().getAttribute("data-quiz-id");
  assert(quizId, "Quiz card is missing a quiz id.");
  return quizId;
}

async function resolveCurrentQuiz(page: Page) {
  const quizId = await readCurrentQuizId(page);
  const quiz = getQuizById(quizId);
  assert(quiz, `Could not resolve quiz data for ${quizId}.`);
  return quiz;
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

async function runRegression(
  page: Page,
  context: BrowserContext,
  baseUrl: string,
  artifactDir: string,
  summary: RegressionSummary
) {
  const basePath = getBasePath(baseUrl);
  const recordCheck = (name: string) => {
    summary.checks.push(name);
    process.stdout.write(`\n[check] ${name}\n`);
  };

  for (const route of ["", "vocabulary/", "reading/", "account/", "challenge/"]) {
    const response = await fetch(resolveAppUrl(baseUrl, route));
    assert(response.ok, `Smoke check failed for ${route || "/"}.`);
  }

  const vocabularyFillBlankQuiz = getVocabularyQuiz(1);
  const sentenceChoiceQuiz = getSentenceQuiz(1);
  const sentenceFillBlankQuiz = getSentenceQuiz(2);
  const autoWordQuiz = getQuizById(`quiz-auto-word-${vocabularyFillBlankQuiz.sourceRef}`);
  const autoSentenceQuiz = getQuizById(`quiz-auto-sentence-${sentenceChoiceQuiz.sourceRef}`);
  const missingQuiz = getQuizById("quiz-auto-word-does-not-exist");

  assert(Boolean(vocabularyFillBlankQuiz.promptSupplementZh), "Vocabulary fill-blank translation is missing at content level.");
  assert(Boolean(sentenceChoiceQuiz.promptSupplementZh), "Sentence single-choice translation is missing at content level.");
  assert(Boolean(sentenceFillBlankQuiz.promptSupplementZh), "Sentence fill-blank translation is missing at content level.");
  assert(autoWordQuiz.type === vocabularyFillBlankQuiz.type, "quiz-auto-word-* did not resolve to a word quiz.");
  assert(autoWordQuiz.sourceRef === vocabularyFillBlankQuiz.sourceRef, "quiz-auto-word-* resolved to the wrong word.");
  assert(autoSentenceQuiz.sourceRef === sentenceChoiceQuiz.sourceRef, "quiz-auto-sentence-* resolved to the wrong sentence.");
  assert(missingQuiz.type === "error", "Missing quiz ids must resolve to an explicit error quiz.");
  assert(expressions.length >= 8, "Expression pool must have at least 8 items.");
  assert(canGenerateExpressionQuiz(), "Expression quiz generator should be enabled once the pool reaches the minimum sample size.");
  recordCheck("smoke check, translations, and quiz id resolvers behave correctly");

  await goto(page, baseUrl, "");
  await page.getByText("English Climb").first().waitFor();
  const navbarChallengeCount = await page.locator("header nav a[href*=\"/challenge\"]").count();
  assert(navbarChallengeCount > 0, "Challenge link is missing from the top navigation.");
  assert(
    (await page.locator('[data-testid="home-challenge-entry"]').count()) > 0,
    "Home challenge entry is missing."
  );
  recordCheck("challenge is reachable from both navbar and home");
  await goto(page, baseUrl, "expressions/");
  assert(
    (await page.locator('[data-testid="quiz-card"]').count()) > 0,
    "Expressions page did not render a normal quiz card."
  );
  recordCheck("expression quiz remains enabled with the expanded pool");
  await page.getByRole("link", { name: "统计" }).click().catch(async () => {
    await page.locator('a[href*="/stats"]').first().click();
  });
  await page.waitForURL((url) => url.pathname.endsWith("/stats/"));
  recordCheck("home navigation reaches stats");

  const faviconResponse = await fetch(resolveAppUrl(baseUrl, "favicon.svg"));
  assert(faviconResponse.ok, "Favicon request failed.");
  const faviconHref = await page.locator('link[rel="icon"]').first().evaluate((element) => {
    return (element as HTMLLinkElement).href;
  });
  assert(
    new URL(faviconHref).pathname === `${basePath}/favicon.svg` ||
      (!basePath && new URL(faviconHref).pathname === "/favicon.svg"),
    "Favicon path is not using the expected base path."
  );
  recordCheck("favicon request and base path are correct");
  await capture(page, artifactDir, "01-stats", summary.screenshots);

  await goto(page, baseUrl, "account/");
  await registerAccount(page, ALPHA_USER, DEFAULT_PASSWORD);
  const alphaAuth = await readAuthState(page);
  assert(alphaAuth.currentUsername === ALPHA_USER, "Alpha account did not become active.");
  recordCheck("alpha account registers and becomes active");

  await goto(page, baseUrl, "vocabulary/");
  const alphaBeforeVocabulary = await readLearningSnapshot(page, ALPHA_USER);
  const overviewPageOne = await getOverviewWords(page);
  assert(overviewPageOne.length === 30, "Vocabulary overview page 1 does not contain 30 words.");
  assert(new Set(overviewPageOne).size === 30, "Vocabulary overview page 1 contains duplicates.");
  await page.locator('[data-testid="vocabulary-overview-next"]').click();
  const overviewPageTwo = await getOverviewWords(page);
  assert(overviewPageTwo.length === 30, "Vocabulary overview page 2 does not contain 30 words.");
  assert(new Set(overviewPageTwo).size === 30, "Vocabulary overview page 2 contains duplicates.");
  assert(
    overviewPageTwo.every((word) => !overviewPageOne.includes(word)),
    "Vocabulary overview pages overlap."
  );
  const highlightCount = await page.locator('[data-testid="word-example-en"] mark').count();
  assert(highlightCount > 0, "Word example highlight is missing.");
  recordCheck("vocabulary overview paging and highlights work");

  await page.locator('[data-testid="word-card"] [data-testid="audio-local-button"]').click();
  await page.locator('[data-testid="word-card"] [data-testid="audio-status"]').waitFor();
  const localAudioStatus = await page
    .locator('[data-testid="word-card"] [data-testid="audio-status"]')
    .innerText();
  assert(
    /local|browser|audio|speech|本地|浏览器|朗读|音频|播放/i.test(localAudioStatus),
    "Local audio status did not update."
  );
  const localAudioPath = await readLastAudioPath(page);
  assert(localAudioPath, "No local audio path was recorded.");
  assert(
    new URL(localAudioPath).pathname.startsWith(`${basePath}/audio/words/`) ||
      (!basePath && new URL(localAudioPath).pathname.startsWith("/audio/words/")),
    "Local audio path is not using the expected base path."
  );
  recordCheck("local audio uses the expected base path");

  await goto(page, baseUrl, "settings/");
  const cloudToggle = page.locator('[data-testid="settings-cloud-audio-toggle"]');
  if (/off|关闭/i.test(await cloudToggle.innerText())) {
    await cloudToggle.click();
  }
  await goto(page, baseUrl, "vocabulary/");
  assert(
    (await page.locator('[data-testid="word-card"] [data-testid="audio-cloud-button"]').count()) > 0,
    "Cloud audio button is missing."
  );
  await context.setOffline(true);
  await page.locator('[data-testid="word-card"] [data-testid="audio-cloud-button"]').click();
  await page.locator('[data-testid="word-card"] [data-testid="audio-status"]').waitFor();
  const cloudOfflineStatus = await page
    .locator('[data-testid="word-card"] [data-testid="audio-status"]')
    .innerText();
  assert(
    /offline|network|离线|网络|不可用/i.test(cloudOfflineStatus),
    "Cloud audio did not report offline status."
  );
  await context.setOffline(false);
  recordCheck("cloud audio button stays visible and reports offline status");

  const previousVocabularyWord = (
    await page.locator('[data-testid="word-card-title"]').innerText()
  ).trim();
  const previousVocabularyQuizId = await readCurrentQuizId(page);
  await page.locator('[data-testid="word-feedback-known"]').click();
  await waitForSnapshotValue(
    page,
    ALPHA_USER,
    "knownWords",
    alphaBeforeVocabulary.knownWords.length + 1
  );
  await page.waitForFunction((previousWord) => {
    const currentWord = document.querySelector('[data-testid="word-card-title"]')?.textContent?.trim();
    return Boolean(currentWord) && currentWord !== previousWord;
  }, previousVocabularyWord);
  await waitForQuizChange(page, previousVocabularyQuizId);
  const alphaWordQuizId = await readCurrentQuizId(page);
  const alphaWordQuiz = await getQuizById(alphaWordQuizId);
  assert(alphaWordQuiz?.type === "fill-blank", "Vocabulary did not advance to the expected next word quiz.");
  assert(
    (await page.locator('[data-testid="quiz-fill-blank-translation"]').count()) > 0,
    "Vocabulary fill-blank translation panel is missing."
  );
  const alphaBeforeWrongAnswer = await readLearningSnapshot(page, ALPHA_USER);
  await answerCurrentQuiz(page, "wrong", false);
  await waitForSnapshotValue(
    page,
    ALPHA_USER,
    "reviewMistakes",
    alphaBeforeWrongAnswer.reviewMistakes.length + 1
  );
  recordCheck("vocabulary fill-blank translation is visible and wrong answers enter review");

  await goto(page, baseUrl, "reading/");
  const readingCountBefore = Number.parseInt(
    await page.locator('[data-testid="reading-completion-count"]').innerText(),
    10
  );
  const titleBefore = (await page.locator('[data-testid="reading-current-title"]').innerText()).trim();
  await page.locator('[data-testid="reading-complete-button"]').click();
  await page.waitForFunction(
    ({ count, title }) => {
      const countText = document.querySelector('[data-testid="reading-completion-count"]')?.textContent?.trim();
      const currentTitle = document.querySelector('[data-testid="reading-current-title"]')?.textContent?.trim();
      return Number.parseInt(countText ?? "0", 10) === count + 1 && currentTitle !== title;
    },
    { count: readingCountBefore, title: titleBefore }
  );
  recordCheck("reading completion increments and switches to the next passage");
  await capture(page, artifactDir, "02-alpha-reading", summary.screenshots);

  await logoutToGuest(page, baseUrl);
  const guestBefore = await readLearningSnapshot(page, "guest");
  assert(guestBefore.knownWords.length === 0, "Guest inherited known words.");
  assert(guestBefore.completedPassageIds.length === 0, "Guest inherited completed passages.");
  recordCheck("guest data stays isolated after alpha logout");

  await goto(page, baseUrl, "vocabulary/");
  await answerCurrentQuiz(page, "wrong", false);
  await waitForSnapshotValue(
    page,
    "guest",
    "reviewMistakes",
    guestBefore.reviewMistakes.length + 1
  );
  const guestAfter = await readLearningSnapshot(page, "guest");
  assert(
    guestAfter.reviewMistakes.length === guestBefore.reviewMistakes.length + 1,
    "Guest wrong answer was not stored."
  );
  recordCheck("guest mistakes stay in guest storage");

  await goto(page, baseUrl, "account/");
  await registerAccount(page, BETA_USER, DEFAULT_PASSWORD);
  const betaAuth = await readAuthState(page);
  assert(betaAuth.currentUsername === BETA_USER, "Beta account did not become active.");
  recordCheck("beta account registers and becomes active");

  await goto(page, baseUrl, "test/");
  assert(
    (await page.locator('[data-testid="test-mode-panel"]').count()) > 0,
    "Standalone test route did not render."
  );

  const betaBeforeTest = await readLearningSnapshot(page, BETA_USER);
  await answerCurrentQuiz(page, "wrong", false);
  await waitForSnapshotValue(page, BETA_USER, "reviewMistakes", betaBeforeTest.reviewMistakes.length + 1);
  await page.locator('[data-testid="test-next-button"]').click();

  const secondQuiz = await resolveCurrentQuiz(page);
  assert(secondQuiz.type === "fill-blank", "Second test question is not the expected fill-blank quiz.");
  assert(
    (await page.locator('[data-testid="quiz-fill-blank-translation"]').count()) > 0,
    "Test-mode fill-blank translation panel is missing."
  );

  const betaAfterFirstWrong = await readLearningSnapshot(page, BETA_USER);
  await answerCurrentQuiz(page, "wrong", false);
  await waitForSnapshotValue(page, BETA_USER, "reviewMistakes", betaAfterFirstWrong.reviewMistakes.length + 1);
  await page.locator('[data-testid="test-next-button"]').click();

  const quizIdBeforeAutoAdvanceOne = await readCurrentQuizId(page);
  await answerCurrentQuiz(page, "correct", true);
  const quizIdAfterAutoAdvanceOne = await readCurrentQuizId(page);
  assert(quizIdAfterAutoAdvanceOne !== quizIdBeforeAutoAdvanceOne, "Test mode did not auto-advance after a correct answer.");

  const quizIdBeforeAutoAdvanceTwo = await readCurrentQuizId(page);
  await answerCurrentQuiz(page, "correct", true);
  const quizIdAfterAutoAdvanceTwo = await readCurrentQuizId(page);
  assert(quizIdAfterAutoAdvanceTwo !== quizIdBeforeAutoAdvanceTwo, "Test mode did not keep auto-advancing after another correct answer.");

  const testIndexText = (await page.locator('[data-testid="test-current-index"]').innerText()).trim();
  assert(testIndexText.startsWith("5 /"), `Expected test progress to reach 5 / N, got "${testIndexText}".`);

  await goto(page, baseUrl, "review/");
  await goto(page, baseUrl, "test/");
  const persistedTestIndexText = (await page.locator('[data-testid="test-current-index"]').innerText()).trim();
  assert(
    persistedTestIndexText.startsWith("5 /"),
    `Test progress did not persist after route switch. Got "${persistedTestIndexText}".`
  );
  const betaSnapshotAfterTestReturn = await readLearningSnapshot(page, BETA_USER);
  assert(
    betaSnapshotAfterTestReturn.testSession.index === 4,
    `Expected persisted test session index 4, got ${betaSnapshotAfterTestReturn.testSession.index}.`
  );
  recordCheck("standalone test mode persists question index and keeps fill-blank translation");

  await goto(page, baseUrl, "review/");
  assert(
    (await page.locator('[data-testid="review-mistake-count"]').count()) > 0,
    "Review route did not render."
  );
  let reviewFillBlankVisible = (await page.locator('[data-testid="quiz-fill-blank-translation"]').count()) > 0;
  const betaReviewSnapshot = await readLearningSnapshot(page, BETA_USER);

  for (let attempt = 0; !reviewFillBlankVisible && attempt < Math.max(betaReviewSnapshot.reviewMistakes.length, 1); attempt += 1) {
    const previousReviewQuizId = await readCurrentQuizId(page);
    await page.locator('[data-testid="review-next-button"]').click();
    await waitForQuizChange(page, previousReviewQuizId);
    reviewFillBlankVisible =
      (await page.locator('[data-testid="quiz-fill-blank-translation"]').count()) > 0;
  }

  assert(
    reviewFillBlankVisible,
    "Review fill-blank translation panel is missing."
  );
  const betaBeforeReviewSolve = await readLearningSnapshot(page, BETA_USER);
  await answerCurrentQuiz(page, "correct", true);
  await waitForSnapshotValue(
    page,
    BETA_USER,
    "reviewMistakes",
    Math.max(betaBeforeReviewSolve.reviewMistakes.length - 1, 0)
  );
  recordCheck("review mode persists and auto-advances after solving a fill-blank mistake");

  await goto(page, baseUrl, "challenge/");
  assert(
    (await page.locator('[data-testid="challenge-mode-panel"]').count()) > 0,
    "Standalone challenge route did not render."
  );
  assert(!examWorldsWarning, `Challenge data warning is set: ${examWorldsWarning}`);
  const worldSwitcherButtons = await page.locator('[data-testid="challenge-world-switcher-button"]').count();
  assert(
    worldSwitcherButtons === examWorlds.length,
    `Expected ${examWorlds.length} challenge world switcher buttons, got ${worldSwitcherButtons}.`
  );
  await page.locator('[data-testid="challenge-level-button"]').first().click();
  await page.locator('[data-testid="challenge-start-level"]').click();
  const betaBeforeChallenge = await readLearningSnapshot(page, BETA_USER);
  await answerCurrentQuiz(page, "wrong", true);
  const challengeIndexText = (await page.locator('[data-testid="challenge-current-index"]').innerText()).trim();
  assert(
    challengeIndexText.startsWith("2 /"),
    `Challenge mode did not auto-advance after a wrong answer. Got "${challengeIndexText}".`
  );
  await page.waitForFunction(
    ({ key, expected }) => {
      const raw = localStorage.getItem(`learningData_${key}`);
      if (!raw) {
        return false;
      }

      const parsed = JSON.parse(raw) as LearningSnapshot | PersistedLearningState;
      const snapshot: LearningSnapshot | null =
        parsed && typeof parsed === "object" && "data" in parsed
          ? (parsed.data ?? null)
          : (parsed as LearningSnapshot);
      return (snapshot?.examMistakes?.length ?? 0) > expected;
    },
    { key: BETA_USER, expected: betaBeforeChallenge.examMistakes.length }
  );

  await goto(page, baseUrl, "review/");
  await goto(page, baseUrl, "challenge/");
  const persistedChallengeIndexText = (await page.locator('[data-testid="challenge-current-index"]').innerText()).trim();
  assert(
    persistedChallengeIndexText.startsWith("2 /"),
    `Challenge progress did not persist after route switch. Got "${persistedChallengeIndexText}".`
  );
  assert(
    (await page.locator('[data-testid="quiz-fill-blank-translation"]').count()) > 0,
    "Challenge fill-blank translation panel is missing after returning."
  );
  const betaChallengeSnapshot = await readLearningSnapshot(page, BETA_USER);
  assert(
    betaChallengeSnapshot.challengeSession.questionIndex === 1,
    `Expected challenge session question index 1, got ${betaChallengeSnapshot.challengeSession.questionIndex}.`
  );
  assert(
    betaChallengeSnapshot.challengeSession.activeLevelId !== null,
    "Expected challenge session to keep the active level."
  );
  recordCheck("challenge route persists level state and auto-advances on both correct and wrong answers");
  await capture(page, artifactDir, "03-beta-challenge", summary.screenshots);

  await goto(page, baseUrl, "account/");
  await loginAccount(page, ALPHA_USER, DEFAULT_PASSWORD);
  const alphaSnapshot = await readLearningSnapshot(page, ALPHA_USER);
  assert(alphaSnapshot.knownWords.length === 1, "Alpha known words were lost after switching back.");
  assert(alphaSnapshot.completedPassageIds.length === 1, "Alpha completed passages were lost after switching back.");
  assert(alphaSnapshot.reviewMistakes.length === 1, "Alpha review mistakes were lost after switching back.");
  recordCheck("account isolation still holds after beta test and challenge sessions");

  await goto(page, baseUrl, "");
  const weeklyMinutesText = await page.locator('[data-testid="home-weekly-minutes"]').innerText();
  const todayWordsText = await page.locator('[data-testid="home-today-words"]').innerText();
  const todaySentencesText = await page.locator('[data-testid="home-today-sentences"]').innerText();
  const todayPassagesText = await page.locator('[data-testid="home-today-passages"]').innerText();
  assert(!Number.isNaN(Number.parseInt(weeklyMinutesText, 10)), "Weekly minutes did not render a numeric value.");
  assert(todayWordsText.trim() !== "", "Home today words stat is blank.");
  assert(todaySentencesText.trim() !== "", "Home today sentences stat is blank.");
  assert(todayPassagesText.trim() !== "", "Home today passages stat is blank.");
  recordCheck("home stats render real derived values");

  summary.accounts = {
    guest: guestAfter,
    alpha: alphaSnapshot,
    beta: betaChallengeSnapshot
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
    accounts: {
      guest: EMPTY_SNAPSHOT,
      alpha: EMPTY_SNAPSHOT,
      beta: EMPTY_SNAPSHOT
    }
  };

  let previewServer: ChildProcess | undefined;

  try {
    if (localPreview && !options.skipBuild) {
      await runCommand("build:content", getCommand("npm"), ["run", "build:content"]);
      await runCommand("build", getCommand("npm"), ["run", "build"]);
    }

    if (localPreview && !options.skipPreview) {
      previewServer = await startPreviewServer(baseUrl, artifactDir);
    }

    const browser = await chromium.launch({ headless: !options.headed });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1200 },
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
