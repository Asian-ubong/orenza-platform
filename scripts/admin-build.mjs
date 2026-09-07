import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync } from 'node:fs';

const run = (command, args) => execFileSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });

console.log('ORENZA Admin build: web validation + Capacitor sync');
run('npm', ['run', 'typecheck']);
run('npm', ['run', 'build']);
run('npx', ['cap', 'sync', 'android', '--config', 'admin-capacitor.config.ts']);

if (existsSync('android/app')) {
  mkdirSync('artifacts', { recursive: true });
  console.log('Android project synchronized. Build release APK/AAB with the admin CI workflow.');
}
