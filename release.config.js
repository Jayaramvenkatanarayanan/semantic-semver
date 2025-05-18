module.exports = {
  branches: ['master'],
  tagFormat: 'v3.0.0',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    // [
    //   '@semantic-release/exec',
    //   {
    //     publishCmd: 'node ./getVersion.js'
    //     // OR if you're hardcoding 2.0.0 (not recommended):
    //     // publishCmd: 'echo "Publishing version 2.0.0"'
    //   }
    // ],
    '@semantic-release/github'
  ]
};