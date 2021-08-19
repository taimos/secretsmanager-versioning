# SecretsManger Versioning

A CLI Tool to manage and version [AWS Secrets](https://aws.amazon.com/de/secrets-manager/) with [SOPS](https://github.com/mozilla/sops)

## Overview

SecretsManager Version is a CLI Tool for Secrets in combination with SOPS. It helps you keep your secrets safe and versioned inside git projects.
The SecretsManager is capable of storing up to 20 tagged secret versions which SecretsManger-Versioning will make use of. The secrets will be versioned by using the MD5 Hash of the encrypted file. With this, every change of the SOPS file will be tagged with a unique key to reference. On top of that, each tag is connected with a Git project and Commit Hash to trace its origin.

## Prerequisites

- [AWS Account](https://aws.amazon.com/account/)
- [KMS Key](https://aws.amazon.com/kms/)
- [AWS CLI (optional)](https://aws.amazon.com/cli/)
- [SOPS](https://github.com/mozilla/sops)
- [Node 12 or higher](https://nodejs.org/en/)
- [GIT](https://git-scm.com/)

## Secret Management

Create a new git repository and open a new terminal there:

```sh
git init .
git remote add origin git@github.com:username/new_repo
```

Create a new sops file and encrypt it with your kms key:

```sh
sops --kms arn:aws:kms:region:account:key/xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx sops.json
```

Now run the following to test if the configuration works:

```
npx secretsmanager-versioning -f sops.json SecretName
```

You should be able to verify that a secret under this name in the currently logged-in account and region was created for you. You can also create a secret yourself and simply reference it. You can verify this by checking the secret in your console or by executing:

```sh
aws secretsmanager describe-secret --secret-id SecretName
```

You should be able to verify that the secret is tagged with a md5 hash and the current version should reference your recent commit.

## Usage

The secret can be used by referring to with the md5 hash. There are multiple ways to do this. One example is highlighted here.

Decrypted Sops File (sops.json)

```json
{
  "example": "supersecretstring"
}
```

### CDK

Add the md5-file dependency to your project and reference your sops file and Secret. After that you should be to reference a jsonField to get reference the secret value:

```ts
import { sync as md5 } from "md5-file";
const secretPath = "path/to/secret";
const versionId = md5("sops.json");
const secret = cdk.SecretValue.secretsManager(secretPath, {
  jsonField: "example",
  versionId: versionId,
}).toString();
console.log(secret); // {{resolve:secretsmanager:path/to/secret:SecretString:example::md5hashvalue}}
```
