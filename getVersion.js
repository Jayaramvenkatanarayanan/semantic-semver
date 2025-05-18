const semver = require("semver");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { generateNotes } = require('@semantic-release/release-notes-generator');
const parserOpts = require('conventional-changelog-angular/lib/parserOpts');

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
  console.error('❌ Invalid semver bump:', releaseType);
  process.exit(1);
}

console.log(`📦 Bumped version: ${currentVersion} → ${newVersion}`);

// 1. Update package.json
packageJson.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2) + '\n');

// 2. Commit the version bump
execSync('git add package.json', { stdio: 'inherit' });
execSync(`git commit -m "chore(release): v${newVersion}"`, { stdio: 'inherit' });
execSync('git push', { stdio: 'inherit' });

// 3. Generate release notes
const generateReleaseNotes = async () => {
  const notes = await generateNotes(
    {
      preset: 'angular',
      parserOpts: await parserOpts(),
    },
    {
      commits: [], // let the plugin pull commits automatically
      logger: console,
      nextRelease: {
        version: newVersion,
        gitTag: `v${newVersion}`,
      },
      lastRelease: {
        version: currentVersion,
        gitTag: `v${currentVersion}`,
      },
    }
  );

  return notes;
};

generateReleaseNotes().then((notes) => {
  const tagName = `v${newVersion}`;
  const safeMessage = notes.replace(/"/g, '\\"').trim();

  // 4. Tag and push the release
  execSync(`git tag -a ${tagName} -m "${safeMessage}"`, { stdio: 'inherit' });
  execSync(`git push origin ${tagName}`, { stdio: 'inherit' });

  // 5. Create GitHub release
  try {
    execSync(`gh release create ${tagName} --title "${tagName}" --notes "${safeMessage}"`, {
      stdio: 'inherit',
    });
    console.log(`🚀 GitHub release ${tagName} published.`);
  } catch (err) {
    console.error('❌ Failed to create GitHub release:', err.message);
  }
}).catch((err) => {
  console.error('❌ Failed to generate release notes:', err.message);
  process.exit(1);
});
