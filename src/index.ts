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
}

export async function updateSecretVersion(params: UpdateSecretOptions) {
  const sopsFile = params.fileName ?? 'sops.json';

  const secretInfo = await describeSecretInfo(params.secretName, sopsFile);

  if (secretInfo.versions.length > 18) {
    await cleanupOldestSecretVersion(secretInfo);
  }

  const secretValue = decodeSopsFile(sopsFile);

  const fileHash = calculateFileHash(sopsFile);

  const needsUpdate = await updateSecretValue(secretInfo, secretValue, fileHash);

  if (needsUpdate) {
    const { remoteUrl, commitHash } = fetchGitInfo();

    await tagSecret(secretInfo, fileHash, commitHash, remoteUrl);
    console.log(`Updating secret ${secretInfo.secretName} successful: New version is ${fileHash}`);
  } else {
    console.log(`Secret ${secretInfo.secretName} already current. Latest version is ${fileHash}`);
  }

}

