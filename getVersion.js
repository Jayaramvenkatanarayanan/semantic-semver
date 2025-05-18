const semver = require("semver");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const pkgPath = path.join(__dirname, "package.json");
const packageJson = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const currentVersion = packageJson.version;

const input = (process.argv[2] || "").trim().toLowerCase();
const releaseType = ["stable", "minor"].includes(input) ? input : "beta";
console.log("🚀 ~ releaseType:", releaseType);

let newVersion;

if (releaseType === "beta") {
  if (semver.prerelease(currentVersion)) {
    newVersion = semver.inc(currentVersion, "prerelease", "beta");
  } else {
    newVersion = semver.inc(currentVersion, "preminor", "beta");
  }
} else {
  if (semver.prerelease(currentVersion)) {
    const parsed = semver.parse(currentVersion);
    const base = `${parsed.major}.${parsed.minor}.${parsed.patch}`;
    newVersion = semver.inc(
      base,
      releaseType === "stable" ? "major" : "minor"
    );
  } else {
    newVersion = semver.inc(
      currentVersion,
      releaseType === "stable" ? "major" : "minor"
    );
  }
}
if (!newVersion) {
  console.error("Invalid semver release type:", releaseType);
  process.exit(1);
}

console.log(` change version: ${currentVersion} → ${newVersion}`);

// Write new version to package.json
packageJson.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2) + "\n", "utf8");

// Commit and push version
execSync("git add package.json", { stdio: "inherit" });
execSync(`git commit -m "chore(release): v${newVersion}"`, { stdio: "inherit" });
execSync("git push", { stdio: "inherit" });

// logs
let changelog = "";
const tagName = `v${newVersion}`;

try {
  changelog = execSync(
    `npx conventional-changelog -p angular --tag-prefix "v" --from ${currentVersion}`,
    { encoding: 'utf-8' }
  ).trim();

  if (!changelog) {
    changelog = execSync(
      `npx conventional-changelog -p angular -r 0`,
      { encoding: 'utf-8' }
    ).trim();
  }
} catch (err) {
  console.error('❌ Error generating changelog:', err.message);
  process.exit(1);
}
console.log("🚀 ~ changelog:", changelog);

// Push tag
const tagMessage = `✨ Release ${tagName}\n\n${changelog}`;
execSync(`git tag -a ${tagName} -m "${tagMessage}"`, { stdio: "inherit" });
execSync(`git push origin ${tagName}`, { stdio: "inherit" });

console.log(` tag ${tagName}.`);

// release
try {
  execSync(`gh release create ${tagName} --title "${tagName}" --notes "${tagMessage.replace(/"/g, '\\"')}"`, {
    stdio: 'inherit',
  });
  console.log(`release tag ${tagName} published.`);
} catch (err) {
  console.error("Failed  release:", err.message);
}
