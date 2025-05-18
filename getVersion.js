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
const tagName = `v${newVersion}`;
try {
    // After creating Git tag...
execSync(`gh release create ${tagName} --title "v${newVersion}" --notes ${JSON.stringify(tagMessage)}`, {
  stdio: 'inherit',
});
  changelog = execSync(
    `npx conventional-changelog -p angular --from ${currentVersion} --to HEAD`,
    { encoding: 'utf-8' }
  ).trim();
  console.log("🚀 ~ changelog:", changelog)
} catch (err) {
  console.error('❌ Error generating changelog:', err.message);
  process.exit(1);
}

  console.log("🚀 ~ changelog:", changelog)

// 6. Create Git tag with changelog
const tagMessage = `✨ Release ${tagName}\n\n${changelog}`;
execSync(`git tag -a ${tagName} -m ${JSON.stringify(tagMessage)}`, { stdio: 'inherit' });
execSync(`git push origin ${tagName}`, { stdio: 'inherit' });
console.log(`🏷️  Git tag ${tagName} created and pushed.`);

// 7. Create GitHub release with changelog
try {
  execSync(`gh release create ${tagName} --title "${tagName}" --notes ${JSON.stringify(tagMessage)}`, {
    stdio: 'inherit',
  });
  console.log(`🚀 GitHub release ${tagName} published.`);
} catch (err) {
  console.error('❌ Failed to create GitHub release:', err.message);
}