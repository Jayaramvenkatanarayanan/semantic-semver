const semver = require("semver");
const path = require("path");
const fs = require("fs");
const { execSync } = require('child_process');
// Read package.json file
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "package.json"), "utf8")
);
const currentVersion = packageJson.version
const releaseType = ["stable", "minor"].includes(
  (process.argv[2] || "").trim().toLowerCase()
)
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
    newVersion = semver.inc(packageJson.version, "preminor", "beta");
  }
} else if (releaseType === "minor" || releaseType === "stable") {
  if (semver.prerelease(packageJson.version)) {
    /**
     * 1.0.0-beta-1 => 1.1.0
     * 1.1.0-beta-10 => 1.2.0
     */
    const parsed = semver.parse(packageJson.version);
    removePreVersion = `${parsed.major}.${parsed.minor}.${parsed.patch}`;
    newVersion = semver.inc(
      removePreVersion,
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
  console.error('Invalid semver bump:', releaseType);
  process.exit(1);
}

console.log(`📦 Bumped version: ${packageJson.version} → ${newVersion}`);

  packageJson.version = newVersion;
  fs.writeFileSync(
    path.join(__dirname, "package.json"),
    JSON.stringify(packageJson, null, 2) + "\n",
    "utf8"
  );
// Commit and push version bump
execSync('git add package.json');
execSync(`git commit -m "chore(release): v${newVersion}"`);
execSync('git push');

// Generate release notes using conventional-changelog
let changelog = '';
try {
  changelog = execSync(
    `npx conventional-changelog -p angular --from ${currentVersion} --to HEAD`,
    { encoding: 'utf-8' }
  ).trim();
} catch (err) {
  console.error('❌ Error generating changelog:', err.message);
  process.exit(1);
}

// Format and create Git tag with changelog as annotation
const tagMessage = `✨ Release v${newVersion}\n\n${changelog}`;
const tagName = `v${newVersion}`;
const tagCommand = `git tag -a ${tagName} -m ${JSON.stringify(tagMessage)}`;

try {
  execSync(tagCommand, { stdio: 'inherit' });
  execSync(`git push origin ${tagName}`, { stdio: 'inherit' });
  console.log(`✅ Created and pushed Git tag: ${tagName}`);
} catch (err) {
  console.error('❌ Failed to create tag:', err.message);
  process.exit(1);
}
