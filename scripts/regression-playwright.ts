import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, type BrowserContext, type Page } from "playwright";

type LearningSnapshot = {
  knownWords?: string[];
  difficultWords?: string[];
  completedPassageIds?: string[];
  reviewMistakes?: string[];
  examMistakes?: string[];
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
    guest: LearningSnapshot;
    alpha: LearningSnapshot;
    beta: LearningSnapshot;
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
  examMistakes: []
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
    } catch {}

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
    return raw ? (JSON.parse(raw) as LearningSnapshot) : null;
  }, profileKey);

  return {
    knownWords: snapshot?.knownWords ?? [],
    difficultWords: snapshot?.difficultWords ?? [],
    completedPassageIds: snapshot?.completedPassageIds ?? [],
    reviewMistakes: snapshot?.reviewMistakes ?? [],
    examMistakes: snapshot?.examMistakes ?? []
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
  const logoutButton = page.getByRole("button", { name: "退出" });

  if ((await logoutButton.count()) > 0) {
    await logoutButton.first().click();
    await waitForCurrentUsername(page);
    return;
  }

  await goto(page, baseUrl, "account/");
  await page.getByRole("button", { name: /退出/ }).first().click();
  await waitForCurrentUsername(page);
}

async function getOverviewWords(page: Page) {
  const locator = page.locator('[data-testid="vocabulary-overview-item"] [data-testid="overview-word"]');
  const words = (await locator.allInnerTexts()).map((item) => item.trim()).filter(Boolean);
  return words;
}

async function clickUntilWrongAnswer(page: Page, profileKey: string) {
  const card = page.locator('[data-testid="quiz-card"]').first();
  const before = await readLearningSnapshot(page, profileKey);
  const optionLocator = card.locator('[data-testid="quiz-option"]');
  const optionCount = await optionLocator.count();

  if (optionCount > 0) {
    for (let index = 0; index < optionCount; index += 1) {
      await optionLocator.nth(index).click();
      await card.locator('[data-testid="quiz-submit"]').click();
      await delay(100);

      const after = await readLearningSnapshot(page, profileKey);
      if (after.reviewMistakes.length > before.reviewMistakes.length) {
        const quizId = await card.getAttribute("data-quiz-id");
        assert(quizId, "Quiz id missing after incorrect single-choice answer.");
        return quizId;
      }
    }
  }

  const fillBlank = card.locator('[data-testid="quiz-fill-blank-input"]');
  if ((await fillBlank.count()) > 0) {
    await fillBlank.fill("regression-wrong-answer");
    await card.locator('[data-testid="quiz-submit"]').click();
    await delay(100);

    const after = await readLearningSnapshot(page, profileKey);
    if (after.reviewMistakes.length > before.reviewMistakes.length) {
      const quizId = await card.getAttribute("data-quiz-id");
      assert(quizId, "Quiz id missing after incorrect fill-blank answer.");
      return quizId;
    }
  }

  throw new Error("Could not force an incorrect answer for the current quiz.");
}

async function clickUntilExamWrongAnswer(page: Page, profileKey: string) {
  const card = page.locator('[data-testid="quiz-card"]').first();
  const before = await readLearningSnapshot(page, profileKey);
  const optionLocator = card.locator('[data-testid="quiz-option"]');
  const optionCount = await optionLocator.count();

  if (optionCount >= 2) {
    await optionLocator.nth(1).click();
    await card.locator('[data-testid="quiz-submit"]').click();
    await delay(100);

    const after = await readLearningSnapshot(page, profileKey);
    if (after.examMistakes.length > before.examMistakes.length) {
      return;
    }
  }

  throw new Error("Could not force an incorrect answer for the current exam quiz.");
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

  await goto(page, baseUrl, "");
  await page.getByText("English Climb").first().waitFor();
  await page.getByRole("link", { name: "统计", exact: true }).click();
  await page.waitForURL((url) => url.pathname.endsWith("/stats/"));
  await page.getByText("学习统计").first().waitFor();
  recordCheck("首页导航和统计页加载正常");

  const faviconResponse = await fetch(resolveAppUrl(baseUrl, "favicon.svg"));
  assert(faviconResponse.ok, "Favicon request failed.");

  const faviconHref = await page.locator('link[rel="icon"]').first().evaluate((element) => {
    return (element as HTMLLinkElement).href;
  });
  assert(
    new URL(faviconHref).pathname === `${basePath}/favicon.svg` || (!basePath && new URL(faviconHref).pathname === "/favicon.svg"),
    "Favicon path is not using the expected base path."
  );
  recordCheck("favicon 路径和请求通过");
  await capture(page, artifactDir, "01-stats", summary.screenshots);

  await goto(page, baseUrl, "account/");
  await registerAccount(page, ALPHA_USER, DEFAULT_PASSWORD);
  const authAfterRegister = await readAuthState(page);
  assert(authAfterRegister.currentUsername === ALPHA_USER, "Alpha account did not become active after registration.");
  recordCheck("账户 A 注册并登录成功");

  await goto(page, baseUrl, "vocabulary/");
  const overviewPageOne = await getOverviewWords(page);
  assert(overviewPageOne.length === 30, "Vocabulary overview page 1 does not contain 30 items.");
  assert(new Set(overviewPageOne).size === 30, "Vocabulary overview page 1 contains duplicate words.");

  await page.locator('[data-testid="vocabulary-overview-next"]').click();
  await delay(100);

  const overviewPageTwo = await getOverviewWords(page);
  assert(overviewPageTwo.length === 30, "Vocabulary overview page 2 does not contain 30 items.");
  assert(new Set(overviewPageTwo).size === 30, "Vocabulary overview page 2 contains duplicate words.");
  assert(
    overviewPageTwo.every((word) => !overviewPageOne.includes(word)),
    "Vocabulary overview pages contain overlapping words."
  );

  const highlightCount = await page.locator('[data-testid="word-example-en"] mark').count();
  assert(highlightCount > 0, "Highlighted keywords are missing in the word example.");
  recordCheck("词汇总览分页稳定且高亮存在");

  await page.locator('[data-testid="word-card"] [data-testid="audio-local-button"]').click();
  await page.locator('[data-testid="word-card"] [data-testid="audio-status"]').waitFor();
  const localAudioStatus = await page
    .locator('[data-testid="word-card"] [data-testid="audio-status"]')
    .innerText();
  assert(
    /本地|朗读/.test(localAudioStatus),
    "Local audio did not enter local playback or browser-speech fallback status."
  );

  const localAudioPath = await readLastAudioPath(page);
  assert(localAudioPath, "Local audio path was not recorded.");
  assert(
    new URL(localAudioPath).pathname.startsWith(`${basePath}/audio/words/`) ||
      (!basePath && new URL(localAudioPath).pathname.startsWith("/audio/words/")),
    "Local audio path is not using the expected base path."
  );

  await goto(page, baseUrl, "settings/");
  const cloudToggle = page.locator('[data-testid="settings-cloud-audio-toggle"]');
  if ((await cloudToggle.innerText()).includes("已关闭")) {
    await cloudToggle.click();
  }

  await goto(page, baseUrl, "vocabulary/");
  assert(
    (await page.locator('[data-testid="word-card"] [data-testid="audio-cloud-button"]').count()) > 0,
    "Cloud audio button is not always visible."
  );

  await context.setOffline(true);
  await page.locator('[data-testid="word-card"] [data-testid="audio-cloud-button"]').click();
  await page.waitForFunction(() => {
    return (
      document
        .querySelector('[data-testid="word-card"] [data-testid="audio-status"]')
        ?.textContent?.includes("离线") ?? false
    );
  });
  const cloudOfflineStatus = await page
    .locator('[data-testid="word-card"] [data-testid="audio-status"]')
    .innerText();
  assert(cloudOfflineStatus.includes("离线"), "Cloud audio button did not report offline status.");
  await context.setOffline(false);
  recordCheck("本地音频和云端按钮行为符合预期");

  await clickUntilWrongAnswer(page, ALPHA_USER);
  await page.locator('[data-testid="word-feedback-known"]').click();
  await page.waitForFunction(() => {
    const raw = localStorage.getItem("learningData_alpha01");
    const snapshot = raw ? (JSON.parse(raw) as LearningSnapshot) : null;
    return (snapshot?.knownWords?.length ?? 0) === 1;
  });
  recordCheck("账户 A 的单词反馈和错题记录写入成功");

  await goto(page, baseUrl, "reading/");
  const readingCountBefore = Number.parseInt(
    await page.locator('[data-testid="reading-completion-count"]').innerText(),
    10
  );
  const titleBefore = (await page.locator('[data-testid="reading-current-title"]').innerText()).trim();
  await page.locator('[data-testid="reading-complete-button"]').click();
  await page.waitForFunction(
    ({ count, title }) => {
      const countText = document
        .querySelector('[data-testid="reading-completion-count"]')
        ?.textContent?.trim();
      const currentTitle = document
        .querySelector('[data-testid="reading-current-title"]')
        ?.textContent?.trim();

      return Number.parseInt(countText ?? "0", 10) === count + 1 && currentTitle !== title;
    },
    { count: readingCountBefore, title: titleBefore }
  );
  recordCheck("阅读完成会增加计数并切换下一篇");
  await capture(page, artifactDir, "02-alpha-reading", summary.screenshots);

  await logoutToGuest(page, baseUrl);
  const guestBefore = await readLearningSnapshot(page, "guest");
  assert(guestBefore.knownWords.length === 0, "Guest inherited known words from account A.");
  assert(
    guestBefore.completedPassageIds.length === 0,
    "Guest inherited completed passages from account A."
  );
  recordCheck("登出后访客数据未继承账户 A 进度");

  await goto(page, baseUrl, "vocabulary/");
  const guestWrongQuizId = await clickUntilWrongAnswer(page, "guest");
  const guestAfter = await readLearningSnapshot(page, "guest");
  assert(guestAfter.reviewMistakes.includes(guestWrongQuizId), "Guest mistakes were not stored.");
  recordCheck("访客错题只写入访客数据");

  await goto(page, baseUrl, "account/");
  await registerAccount(page, BETA_USER, DEFAULT_PASSWORD);
  await goto(page, baseUrl, "vocabulary/");
  const betaWrongQuizId = await clickUntilWrongAnswer(page, BETA_USER);
  await page.locator('[data-testid="word-feedback-tricky"]').click();
  await delay(100);
  const betaSecondWrongQuizId = await clickUntilWrongAnswer(page, BETA_USER);

  const betaSnapshotAfter = await readLearningSnapshot(page, BETA_USER);
  assert(betaSnapshotAfter.difficultWords.length === 1, "Account B difficult words were not stored.");
  assert(
    betaSnapshotAfter.reviewMistakes.includes(betaWrongQuizId) &&
      betaSnapshotAfter.reviewMistakes.includes(betaSecondWrongQuizId),
    "Account B mistakes were not stored."
  );
  recordCheck("账户 B 的难词和错题写入成功");

  await goto(page, baseUrl, "account/");
  await loginAccount(page, ALPHA_USER, DEFAULT_PASSWORD);
  await goto(page, baseUrl, "stats/");
  await page.getByText(`当前统计对象：${ALPHA_USER}`).first().waitFor();
  await goto(page, baseUrl, "review/");
  const alphaSnapshot = await readLearningSnapshot(page, ALPHA_USER);
  const alphaReviewCount = Number.parseInt(
    await page.locator('[data-testid="review-mistake-count"]').innerText(),
    10
  );
  assert(alphaSnapshot.knownWords.length === 1, "Account A known words mismatch after switching back.");
  assert(
    alphaSnapshot.completedPassageIds.length === 1,
    "Account A completed passage count mismatch after switching back."
  );
  assert(alphaSnapshot.reviewMistakes.length === 1, "Account A mistakes mismatch after switching back.");
  assert(alphaReviewCount === alphaSnapshot.reviewMistakes.length, "Review page is not showing account A data.");
  recordCheck("切回账户 A 后统计和复习数据仍独立");

  await goto(page, baseUrl, "account/");
  await loginAccount(page, BETA_USER, DEFAULT_PASSWORD);
  await goto(page, baseUrl, "stats/");
  await page.getByText(`当前统计对象：${BETA_USER}`).first().waitFor();
  await goto(page, baseUrl, "review/");
  const betaSnapshot = await readLearningSnapshot(page, BETA_USER);
  const betaReviewCount = Number.parseInt(
    await page.locator('[data-testid="review-mistake-count"]').innerText(),
    10
  );
  assert(betaSnapshot.knownWords.length === 0, "Account B inherited account A known words.");
  assert(betaSnapshot.difficultWords.length === 1, "Account B difficult words mismatch after switching back.");
  assert(betaSnapshot.reviewMistakes.length === 2, "Account B review mistakes mismatch after switching back.");
  assert(betaReviewCount === betaSnapshot.reviewMistakes.length, "Review page is not showing account B data.");
  recordCheck("切回账户 B 后统计和复习数据仍独立");

  await page.getByRole("button", { name: "测试模式" }).click();
  await page.getByText("测试模式说明").waitFor();
  await page.getByRole("button", { name: "上一题" }).waitFor();
  await page.getByRole("button", { name: "下一题" }).waitFor();
  recordCheck("测试模式可切换且提供前后题导航");

  await page.getByRole("button", { name: "考试模式" }).click();
  await page.getByText("考试模式说明").waitFor();
  await page.getByRole("button", { name: "1", exact: true }).first().click();
  await page.getByText("词汇范围").first().waitFor();
  await clickUntilExamWrongAnswer(page, BETA_USER);
  const betaExamSnapshot = await readLearningSnapshot(page, BETA_USER);
  assert(betaExamSnapshot.examMistakes.length > 0, "Exam mistakes were not stored separately.");
  recordCheck("考试模式地图可进入，错题会写入考试错题库");
  await capture(page, artifactDir, "03-beta-review", summary.screenshots);

  summary.accounts = {
    guest: guestAfter,
    alpha: alphaSnapshot,
    beta: betaExamSnapshot
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
