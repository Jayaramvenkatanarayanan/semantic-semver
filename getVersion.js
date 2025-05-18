const semver = require("semver");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
const currentVersion = packageJson.version;

const releaseType = ["stable", "minor"].includes((process.argv[2] || "").trim().toLowerCase())
  ? (process.argv[2] || "").trim().toLowerCase()
  : "beta";
console.log("🚀 ~ releaseType:", releaseType);

let newVersion;

if (releaseType === "beta") {
  if (semver.prerelease(packageJson.version)) {
    /**
     * 1.0.0-beta-1 => 1.0.0-beta.2
     */
    newVersion = semver.inc(packageJson.version, "prerelease", "beta");
  } else {
    /**
     * 1.0.0 => 1.0.0-beta.1
     */
    newVersion = semver.inc(packageJson.version, "prerelease", "beta");
  }
} else if (releaseType === "minor" || releaseType === "stable") {
  if (semver.prerelease(packageJson.version)) {
    /**
     * 1.0.0-beta-1 => 1.1.0
     * 1.1.0-beta-10 => 1.2.0
     */
    const parsed = semver.parse(packageJson.version);
    removedPreVersion = `${parsed.major}.${parsed.minor}.${parsed.patch}`;
    newVersion = semver.inc(
      removedPreVersion,
      releaseType === "stable" ? "major" : "minor"
    );
  } else {
    newVersion = semver.inc(
      packageJson.version,
      releaseType === "stable" ? "major" : "minor"
    );
  }
}
if (!newVersion) {
  console.error("Invalid semver release type:", releaseType);
  process.exit(1);
}

console.log(` change version: ${currentVersion} → ${newVersion}`);

// re-write package.json
packageJson.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2) + "\n", "utf8");

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
