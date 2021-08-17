import minimist from 'minimist';
import { updateSecretVersion } from '.';

const args = minimist(process.argv.slice(2), {
  string: [
    'file',
  ],
  alias: {
    file: 'f',
  },
});

void (async () => {
  if (args._.length !== 1) {
    console.log('Please specify a secret name');
    process.exit(1);
  }
  try {
    const secretName = args._[0];
    await updateSecretVersion({
      secretName,
      fileName: args.file,
    });
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
})();