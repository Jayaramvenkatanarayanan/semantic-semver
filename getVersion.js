const semver = require("semver");
const path = require("path");
const fs = require("fs");
// Read package.json file
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "package.json"), "utf8")
);

const releaseType = ["stable", "minor"].includes(
  (process.argv[2] || "").trim().toLowerCase()
)
  ? (process.argv[2] || "").trim().toLowerCase()
  : "beta";
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
  }
}

//re-write
packageJson.version = newVersion;
fs.writeFileSync(
  path.join(__dirname, "package.json"),
  JSON.stringify(packageJson, null, 2) + "\n",
  "utf8"
);
console.log("🚀 ~ newVersion:", newVersion);
return newVersion;
