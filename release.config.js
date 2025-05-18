module.exports = {
  branches: ['master'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    // [
    //   '@semantic-release/exec',
    //   {
    //     publishCmd: 'bash -c "echo 🚀 Releasing version 11.11.11 && echo Environment: $SHELL && echo Next Release Version: 11.11.11"'
    //     // OR if you're hardcoding 2.0.0 (not recommended):
    //     // publishCmd: 'echo "Publishing version 2.0.0"'
    //   }
    // ],
    '@semantic-release/github'
  ]
};