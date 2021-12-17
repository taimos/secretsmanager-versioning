import { Agent } from 'http';
import { fromTemporaryCredentials } from '@aws-sdk/credential-providers';
import agent from 'proxy-agent';

const awsOptions = {
  ...(process.env.HTTPS_PROXY || process.env.https_proxy) && {
    httpOptions: {
      agent: agent(process.env.HTTPS_PROXY || process.env.https_proxy) as any as Agent,
    },
  },
};

export function createAwsClient<T extends { new(...args: any[]): InstanceType<T> }>(cls: T, roleArn?: string): InstanceType<T> {
  if (roleArn) {
    return new cls({
      ...awsOptions,
      credentials: fromTemporaryCredentials({
        params: {
          RoleArn: roleArn,
          RoleSessionName: 'secretsmanager-versioning',
        },
      }),
    });
  }
  return new cls(awsOptions);
}