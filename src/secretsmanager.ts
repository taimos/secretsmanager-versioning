import * as AWS from 'aws-sdk';
import { createAwsClient } from './aws';
import { getSopsKey } from './sops';

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

export async function describeSecretInfo(secretName: string, sopsFile: string): Promise<SecretInfo> {
  const client = createAwsClient(AWS.SecretsManager);
  try {
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
  } catch (error: any) {
    if (error.code === 'ResourceNotFoundException') {
      return await createSecret(secretName, sopsFile);
    }
    throw error;
  }
}

export async function createSecret(secretName: string, sopsFile: string): Promise<SecretInfo> {
  const client = createAwsClient(AWS.SecretsManager);
  const id = await createAwsClient(AWS.STS).getCallerIdentity().promise();

  const keyArn = getSopsKey(sopsFile, id.Account!, process.env.AWS_DEFAULT_REGION ?? process.env.AWS_REGION ?? 'us-east-1');
  if (!keyArn) {
    throw new Error('cannot find KMS key to use for secret creation');
  }
  console.log(`Creating new Secret ${secretName} with KMS key ${keyArn}`);

  const createdSecret = await client.createSecret({
    Name: secretName,
    KmsKeyId: keyArn,
    SecretString: 'init',
  }).promise();

  return {
    secretName: createdSecret.Name!,
    secretArn: createdSecret.ARN!,
    kmsKey: keyArn,
    versions: [],
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
    }, {
      Key: 'version:latest',
      Value: version,
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