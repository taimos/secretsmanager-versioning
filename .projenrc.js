const { TaimosTypescriptLibrary } = require('@taimos/projen');
const project = new TaimosTypescriptLibrary({
  defaultReleaseBranch: 'main',
  devDeps: ['@taimos/projen'],
  name: 'secretsmanager-versioning',
  deps: [
    'aws-sdk',
    'md5-file',
    'minimist',
    'proxy-agent',
  ],
  devDeps: [
    'ts-node',
    '@taimos/projen',
  ],
  description: 'Toolkit to version secrets in AWS SecretsManager',
  bin: {
    'secretsmanager-versioning': 'lib/cli.js',
  },
});
project.synth();