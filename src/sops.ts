import { execSync } from 'child_process';
import * as fs from 'fs';
import { sync as md5 } from 'md5-file';

export function decodeSopsFile(fileName: string): string {
  if (!fs.existsSync(fileName)) {
    throw new Error('Cannot find file: ' + fileName);
  }
  return execSync(`sops -d ${fileName}`).toString();
}

export function calculateFileHash(fileName: string): string {
  return md5(fileName);
}

export function getSopsKey(fileName: string, account: string, region: string): string | undefined {
  const content = JSON.parse(fs.readFileSync(fileName, { encoding: 'utf-8' }));
  const kmsKeys = content.sops.kms.map((key: any) => key.arn) as string[];
  return kmsKeys.find(k => k.startsWith(`arn:aws:kms:${region}:${account}:key`));
}