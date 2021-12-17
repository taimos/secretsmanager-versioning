import { fetchGitInfo } from './git';
import { cleanupOldestSecretVersion, describeSecretInfo, tagSecret, updateSecretValue } from './secretsmanager';
import { calculateFileHash, decodeSopsFile } from './sops';

export interface UpdateSecretOptions {
  /**
   * The name of the AWS SecretsManager Secret
   *
   * @default sops.json
   */
  readonly secretName: string;

  /**
   * The name of the SOPS file
   *
   * @default sops.json
   */
  readonly fileName?: string;

  /**
   * The name of the role to assume
   *
   * @default -
   */
  readonly roleArn?: string;
}

export async function updateSecretVersion(params: UpdateSecretOptions) {
  const sopsFile = params.fileName ?? 'sops.json';

  const secretInfo = await describeSecretInfo(params.secretName, sopsFile, params.roleArn);

  if (secretInfo.versions.length > 18) {
    await cleanupOldestSecretVersion(secretInfo, params.roleArn);
  }

  const secretValue = decodeSopsFile(sopsFile);

  const fileHash = calculateFileHash(sopsFile);

  const needsUpdate = await updateSecretValue(secretInfo, secretValue, fileHash, params.roleArn);

  if (needsUpdate) {
    const { remoteUrl, commitHash } = fetchGitInfo();

    await tagSecret(secretInfo, fileHash, commitHash, remoteUrl, params.roleArn);
    console.log(`Updating secret ${secretInfo.secretName} successful: New version is ${fileHash}`);
  } else {
    console.log(`Secret ${secretInfo.secretName} already current. Latest version is ${fileHash}`);
  }

}

