import * as AWS from 'aws-sdk';
import { createAwsClient } from './aws';

export interface SecretVersionInfo {
  hash: string;
  date?: string;
  commit?: string;
  current: boolean;
}

export interface SecretInfo {
  secretName: string;
  secretArn: string;
  kmsKey?: string;
  versions: SecretVersionInfo[];
}

export async function describeSecretInfo(secretName: string): Promise<SecretInfo> {
  const client = createAwsClient(AWS.SecretsManager);
  const describe = await client.describeSecret({ SecretId: secretName }).promise();

  const versions: SecretVersionInfo[] = [];
  for (const entry of Object.entries(describe.VersionIdsToStages!)) {
    const versionHash = entry[0];
    const versionTag = describe.Tags?.find(t => t.Key === `version:${versionHash}`);
    const [versionCommit, versionDate] = versionTag?.Value ? versionTag?.Value?.split('/') : [undefined, undefined];

    versions.push({
      hash: versionHash,
      current: entry[1].indexOf('AWSCURRENT') !== -1,
      commit: versionCommit,
      date: versionDate,
    });
  };
  versions.sort(versionCompare);

  return {
    secretName: describe.Name!,
    secretArn: describe.ARN!,
    kmsKey: describe.KmsKeyId,
    versions,
  };
}

export async function cleanupOldestSecretVersion(secretInfo: SecretInfo): Promise<void> {
  const oldest = secretInfo.versions[0];
  console.log(`Cleaning up oldest version ${oldest.hash} from ${oldest.date}`);

  const client = createAwsClient(AWS.SecretsManager);
  await client.updateSecretVersionStage({
    SecretId: secretInfo.secretName,
    VersionStage: oldest.hash,
    RemoveFromVersionId: oldest.hash,
  }).promise();
  await client.untagResource({
    SecretId: secretInfo.secretName,
    TagKeys: [`version:${oldest.hash}`],
  }).promise();
}

export async function updateSecretValue(secretInfo: SecretInfo, secretValue: string, fileHash: string): Promise<boolean> {
  if (secretInfo.versions.find(v => v.hash === fileHash)?.current) {
    return false;
  }
  const client = createAwsClient(AWS.SecretsManager);
  await client.putSecretValue({
    SecretId: secretInfo.secretName,
    ClientRequestToken: fileHash,
    SecretString: secretValue,
    VersionStages: ['AWSCURRENT', fileHash],
  }).promise();
  return true;
}

export async function tagSecret(secretInfo: SecretInfo, version: string, commitHash: string, remoteUrl: string): Promise<void> {
  const client = createAwsClient(AWS.SecretsManager);
  await client.tagResource({
    SecretId: secretInfo.secretName,
    Tags: [{
      Key: `version:${version}`,
      Value: `${commitHash}/${new Date().toISOString()}`,
    }, {
      Key: 'sourceInfo',
      Value: remoteUrl,
    }],
  }).promise();
}

function versionCompare(a: SecretVersionInfo, b: SecretVersionInfo): number {
  if (!a.date && !b.date) {
    return a.hash.localeCompare(b.hash);
  }
  if (!a.date) {
    return -1;
  }
  if (!b.date) {
    return 1;
  }
  return a.date.localeCompare(b.date);
}