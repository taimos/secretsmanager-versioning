const { TaimosTypescriptLibrary } = require('@taimos/projen');
const project = new TaimosTypescriptLibrary({
  defaultReleaseBranch: 'main',
  devDeps: ['@taimos/projen'],
  name: 'secret-versioning',

  // deps: [],                          /* Runtime dependencies of this module. */
  // description: undefined,            /* The description is just a string that helps people understand the purpose of the package. */
  // packageName: undefined,            /* The "name" in package.json. */
  // projectType: ProjectType.UNKNOWN,  /* Which type of project this is (library/app). */
  // release: undefined,                /* Add release management to this project. */
});
project.synth();