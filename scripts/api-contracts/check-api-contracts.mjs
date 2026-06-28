import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const mode = process.argv[2] ?? "all";

const requiredContractHeadings = [
  "## Provider Name",
  "## Karpilo Module Owner",
  "## Purpose",
  "## Official Provider Documentation",
  "## Required Environment Variables",
  "## Forbidden Environment Usage",
  "## Endpoints Used",
  "## Normalized Internal Output",
  "## Required Mock Files",
  "## Failure Classifications",
  "## Drift Rules",
  "## Last Verified Date",
];

const requiredDocFields = [
  "Official provider documentation URL",
  "Endpoint documentation URL",
  "Authentication documentation URL",
  "Rate limit/quota documentation URL",
];

const requiredFailureMarkers = [
  "401",
  "403",
  "404",
  "timeout",
  "429",
  "500+",
  "malformed JSON",
  "empty response",
  "network failure",
];

const forbiddenPublicSecretNames = [
  "NEXT_PUBLIC_OPENAI_API_KEY",
  "NEXT_PUBLIC_GOOGLE_WEATHER_API_KEY",
  "NEXT_PUBLIC_STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_RESEND_API_KEY",
  "NEXT_PUBLIC_SENTRY_AUTH_TOKEN",
];

const realSecretPatterns = [
  /sk_live_[A-Za-z0-9]{16,}/,
  /sk_test_[A-Za-z0-9]{24,}/,
  /whsec_[A-Za-z0-9]{16,}/,
  /AIza[0-9A-Za-z_-]{30,}/,
  /xox[baprs]-[0-9A-Za-z-]{20,}/,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/,
];

function readRelative(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function existsRelative(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function isDirectoryRelative(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath)) &&
    fs.statSync(path.join(rootDir, relativePath)).isDirectory();
}

function parseProviderIndex() {
  const readme = readRelative("docs/api-contracts/README.md");
  return readme
    .split("\n")
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .map((line) => line.slice(1, -1).split("|").map((cell) => cell.trim()))
    .filter((cells) => cells.length === 8)
    .filter((cells) => cells[0] !== "Provider" && !cells[0].startsWith("---"))
    .map((cells) => ({
      provider: cells[0],
      category: cells[1],
      contractFile: contractPathFromIndex(stripBackticks(cells[2])),
      owner: cells[3],
      requiredEnvVars: cells[4],
      testFile: stripBackticks(cells[5]),
      fixtureDirectory: stripBackticks(cells[6]),
      lastVerified: cells[7],
    }));
}

function stripBackticks(value) {
  return value.replace(/^`|`$/g, "");
}

function contractPathFromIndex(value) {
  return value.startsWith("docs/api-contracts/")
    ? value
    : `docs/api-contracts/${value}`;
}

function sectionText(markdown, heading) {
  const start = markdown.indexOf(heading);
  if (start === -1) return "";
  const afterStart = markdown.slice(start + heading.length);
  const nextHeading = afterStart.search(/\n## /);
  return nextHeading === -1 ? afterStart : afterStart.slice(0, nextHeading);
}

function extractBacktickPaths(markdown, prefix) {
  return [...markdown.matchAll(/`([^`]+)`/g)]
    .map((match) => match[1])
    .filter((value) => value.startsWith(prefix));
}

function extractEnvVars(markdown) {
  const section = sectionText(markdown, "## Required Environment Variables");
  return new Set(
    [...section.matchAll(/`([A-Z][A-Z0-9_]{2,})`/g)].map((match) => match[1])
  );
}

function envExampleAssignments() {
  const envExample = readRelative(".env.example");
  return new Set(
    envExample
      .split("\n")
      .map((line) => line.match(/^\s*([A-Z][A-Z0-9_]+)=/))
      .filter(Boolean)
      .map((match) => match[1])
  );
}

function gitOutput(args) {
  return execFileSync("git", args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function gitCheckIgnore(relativePath) {
  try {
    gitOutput(["check-ignore", relativePath]);
    return true;
  } catch {
    return false;
  }
}

function trackedAndCandidateFiles() {
  return gitOutput(["ls-files", "--cached", "--others", "--exclude-standard"])
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((relativePath) => !relativePath.startsWith("node_modules/"))
    .filter((relativePath) => !relativePath.startsWith(".next/"))
    .filter((relativePath) => relativePath !== ".env.local");
}

function checkDocs() {
  const failures = [];
  const rows = parseProviderIndex();

  if (rows.length === 0) {
    failures.push("docs/api-contracts/README.md provider index has no rows.");
  }

  for (const row of rows) {
    if (!row.provider || !row.category || !row.owner || !row.lastVerified) {
      failures.push(`Provider index row is incomplete: ${JSON.stringify(row)}`);
    }

    if (!existsRelative(row.contractFile)) {
      failures.push(`${row.provider} contract file is missing: ${row.contractFile}`);
      continue;
    }

    if (!existsRelative(row.testFile)) {
      failures.push(`${row.provider} test scaffold is missing: ${row.testFile}`);
    }

    if (!isDirectoryRelative(row.fixtureDirectory)) {
      failures.push(`${row.provider} fixture directory is missing: ${row.fixtureDirectory}`);
    }

    const contract = readRelative(row.contractFile);
    for (const heading of requiredContractHeadings) {
      if (!contract.includes(heading)) {
        failures.push(`${row.contractFile} missing required heading: ${heading}`);
      }
    }

    for (const field of requiredDocFields) {
      if (!contract.includes(field)) {
        failures.push(`${row.contractFile} missing provider documentation field: ${field}`);
      }
    }
  }

  return failures;
}

function checkEnv() {
  const failures = [];

  if (!existsRelative(".env.example")) {
    failures.push(".env.example is missing.");
    return failures;
  }

  if (!gitCheckIgnore(".env.local")) {
    failures.push(".env.local is not gitignored.");
  }

  if (gitCheckIgnore(".env.example")) {
    failures.push(".env.example is still gitignored.");
  }

  const assignments = envExampleAssignments();
  const rows = parseProviderIndex();

  for (const row of rows) {
    const contract = readRelative(row.contractFile);
    for (const envVar of extractEnvVars(contract)) {
      if (!assignments.has(envVar)) {
        failures.push(`${envVar} is documented in ${row.contractFile} but missing from .env.example.`);
      }
    }
  }

  for (const forbiddenName of forbiddenPublicSecretNames) {
    if (assignments.has(forbiddenName)) {
      failures.push(`Forbidden public secret variable is present in .env.example: ${forbiddenName}`);
    }
  }

  return failures;
}

function checkFixtures() {
  const failures = [];
  const rows = parseProviderIndex();

  for (const row of rows) {
    if (!isDirectoryRelative(row.fixtureDirectory)) {
      failures.push(`${row.provider} fixture directory is missing: ${row.fixtureDirectory}`);
      continue;
    }

    const contract = readRelative(row.contractFile);
    const requiredMockSection = sectionText(contract, "## Required Mock Files");
    const fixturePaths = extractBacktickPaths(requiredMockSection, "test-fixtures/");

    if (fixturePaths.length === 0) {
      failures.push(`${row.contractFile} does not list required mock fixture paths.`);
    }

    for (const fixturePath of fixturePaths) {
      const parentDirectory = path.dirname(fixturePath);
      if (!isDirectoryRelative(parentDirectory)) {
        failures.push(`${row.contractFile} fixture parent directory is missing: ${parentDirectory}`);
      }
    }
  }

  return failures;
}

function checkSecretExposure() {
  const failures = [];

  for (const relativePath of trackedAndCandidateFiles()) {
    const absolutePath = path.join(rootDir, relativePath);
    if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).isDirectory()) continue;

    let contents;
    try {
      contents = fs.readFileSync(absolutePath, "utf8");
    } catch {
      continue;
    }

    for (const pattern of realSecretPatterns) {
      if (pattern.test(contents)) {
        failures.push(`${relativePath} appears to contain a real secret matching ${pattern}.`);
      }
    }
  }

  return failures;
}

function checkFailureClassificationMetadata() {
  const failures = [];
  const testFiles = trackedAndCandidateFiles()
    .filter((relativePath) => relativePath.startsWith("tests/api-contracts/"))
    .filter((relativePath) => relativePath.endsWith(".test.ts"));

  for (const relativePath of testFiles) {
    const contents = readRelative(relativePath);
    const blocks = [...contents.matchAll(/requiredFailureClasses:\s*\[([\s\S]*?)\]/g)];

    for (const block of blocks) {
      const classifications = block[1];
      for (const marker of requiredFailureMarkers) {
        if (!classifications.includes(marker)) {
          failures.push(`${relativePath} requiredFailureClasses missing ${marker}.`);
        }
      }

      if (/"[^"]*generic[^"]*"/i.test(classifications)) {
        failures.push(`${relativePath} has a generic provider failure classification.`);
      }
    }
  }

  return failures;
}

function runChecks(selectedMode) {
  const failures = [];

  if (selectedMode === "all" || selectedMode === "docs") {
    failures.push(...checkDocs());
  }

  if (selectedMode === "all" || selectedMode === "env") {
    failures.push(...checkEnv(), ...checkSecretExposure());
  }

  if (selectedMode === "all" || selectedMode === "fixtures") {
    failures.push(...checkFixtures(), ...checkFailureClassificationMetadata());
  }

  if (!["all", "docs", "env", "fixtures"].includes(selectedMode)) {
    failures.push(`Unknown api-contracts check mode: ${selectedMode}`);
  }

  return failures;
}

const failures = runChecks(mode);

if (failures.length > 0) {
  console.error(`API contract governance check failed (${mode}):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(`API contract governance check passed (${mode}).`);
}
