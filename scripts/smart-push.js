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

const checkForChanges = () => {
  const status = execSync('git status --porcelain').toString();
  return status.length > 0; // Returns true if there are changes
};

readline.question('Enter your commit message: ', (commitMessage) => {
  readline.question('What kind of version bump? (patch/minor/major) ', (bump) => {
    if (['patch', 'minor', 'major'].includes(bump)) {
      if (checkForChanges()) {
        gitAdd();
        executeCommand(`git commit -m "${commitMessage}"`);
      } else {
        console.log('No changes to commit.');
      }
      executeCommand(`npm version ${bump} -m "Bump version to %s"`);
      executeCommand('git push && git push --tags');
      console.log('Version bumped and pushed successfully!');
    } else {
      console.log('Invalid bump type. Please use patch, minor, or major.');
    }
    readline.close();
  });
});
