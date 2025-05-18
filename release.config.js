module.exports = {
  branches: ['master'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    // [
    //   '@semantic-release/exec',
    //   {
    //     // Pass the next version to a custom script
    //     publishCmd: 'node ./scripts/release.js ${nextRelease.version}'
    //   }
    // ],
    '@semantic-release/github'
  ]
};