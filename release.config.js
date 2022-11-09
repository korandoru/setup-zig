export default {
  preset: 'conventionalcommits',
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/github',
      {
        failComment: false,
        failTitle: false,
        releasedLabels: false
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: ['dist'],
        message: 'chore: Release ${nextRelease.version} [skip ci]'
      }
    ]
  ]
}
