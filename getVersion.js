const semver = require("semver");
const path = require("path");
const fs = require("fs");
const { execSync } = require('child_process');
// Read package.json file
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "package.json"), "utf8")
);

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
//re-write
if (newVersion) {
const tag = process.argv[3] || 'latest'; // npm dist-tag
  packageJson.version = newVersion;
  fs.writeFileSync(
    path.join(__dirname, "package.json"),
    JSON.stringify(packageJson, null, 2) + "\n",
    "utf8"
  );
  console.log("🚀 ~ newVersion:", newVersion);
//   Commit version bump
//   execSync(`git tag v${newVersion}`);
//   execSync(`git push && git push --tags`);

  // Publish to npm with tag
//   execSync(`npm publish --tag ${tag}`, { stdio: "inherit" });

  console.log(`✅ Published v${newVersion} to npm with tag "${tag}"`);

const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();

const rawLog = execSync(
  `git log ${lastTag}..HEAD --pretty=format:"%h %s"`,
  { encoding: 'utf-8' }
);

const commits = rawLog
  .split('\n')
  .map(line => {
    const [hash, ...messageParts] = line.trim().split(' ');
    const message = messageParts.join(' ');
    return { hash, message };
  })
  .filter(commit =>
    /^(feat|fix|chore|refactor|docs|test|perf)(\(.+\))?:/.test(commit.message)
  );

console.log(`🔖 Commits since ${lastTag}:\n`);
commits.forEach(commit => {
  console.log(`- ${commit.hash} ${commit.message}`);
});
}
