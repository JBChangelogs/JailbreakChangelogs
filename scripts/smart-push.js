const { execSync } = require('child_process');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const executeCommand = (command) => {
  try {
    console.log(`Executing: ${command}`);
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error);
    process.exit(1);
  }
};

const gitAdd = () => {
  executeCommand('git add .');
};

readline.question('Enter your commit message: ', (commitMessage) => {
  readline.question('What kind of version bump? (patch/minor/major) ', (bump) => {
    if (['patch', 'minor', 'major'].includes(bump)) {
      gitAdd();
      executeCommand(`git commit -m "${commitMessage}"`);
      executeCommand(`npm version ${bump} -m "Bump version to %s"`);
      executeCommand('git push && git push --tags');
      console.log('Changes committed, version bumped, and pushed successfully!');
    } else {
      console.log('Invalid bump type. Please use patch, minor, or major.');
    }
    readline.close();
  });
});
