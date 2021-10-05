const { TaimosTypescriptLibrary } = require('@taimos/projen');

const project = new TaimosTypescriptLibrary({
  name: 'secretsmanager-versioning',
  description: 'Toolkit to version secrets in AWS SecretsManager using SOPS',
  defaultReleaseBranch: 'main',
  devDeps: [
    'ts-node',
    '@taimos/projen',
  ],
  deps: [
    'aws-sdk',
    'md5-file',
    'minimist',
    'proxy-agent',
  ],
  bin: {
    'secretsmanager-versioning': 'lib/cli.js',
  },
  projenUpgradeSecret: 'GH_TOKEN',
});

project.synth();