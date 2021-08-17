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