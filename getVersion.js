const fs = require('fs');
const semver = require('semver');

// Read package.json file
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Extract version string
const version = packageJson.version;

console.log('Version from package.json:', version);