import { execSync } from 'child_process';

export interface GitInfo {
  remoteUrl: string;
  commitHash: string;
}

export function fetchGitInfo(): GitInfo {
  return {
    commitHash: execSync('git rev-parse HEAD').toString().trim(),
    remoteUrl: execSync('git remote get-url origin').toString().trim(),
  };
}