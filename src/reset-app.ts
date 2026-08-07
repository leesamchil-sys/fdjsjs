import { execSync } from 'child_process';

try {
  console.log('Restoring App.tsx from git index...');
  const output = execSync('git checkout src/App.tsx', { encoding: 'utf-8' });
  console.log('Restore output:', output);
} catch (error) {
  console.error('Failed to restore App.tsx:', error);
}
