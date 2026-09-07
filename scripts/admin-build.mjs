import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, cpSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const work = resolve(root, '.admin-capacitor-work');
const adminAndroid = resolve(root, 'android-admin');
const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });

console.log('ORENZA Admin build: typecheck + production build + dedicated Android generation');
run('npm', ['run', 'typecheck']);
run('npm', ['run', 'build']);

rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });
cpSync(resolve(root, 'admin-capacitor.config.ts'), resolve(work, 'admin-capacitor.config.ts'));
cpSync(resolve(root, 'public'), resolve(work, 'public'), { recursive: true });
symlinkSync(resolve(root, 'node_modules'), resolve(work, 'node_modules'), 'junction');

console.log('Generating isolated Admin Android project in android-admin/');
run('npx', ['cap', 'add', 'android', '--config', 'admin-capacitor.config.ts'], work);
run('npx', ['cap', 'sync', 'android', '--config', 'admin-capacitor.config.ts'], work);

rmSync(adminAndroid, { recursive: true, force: true });
cpSync(resolve(work, 'android'), adminAndroid, { recursive: true });
rmSync(work, { recursive: true, force: true });

if (!existsSync(resolve(adminAndroid, 'app'))) throw new Error('Admin Android project was not generated.');
mkdirSync(resolve(root, 'artifacts'), { recursive: true });
console.log('Admin Android project ready at android-admin/.');
console.log('Build APK/AAB with: cd android-admin && ./gradlew assembleDebug assembleRelease bundleRelease');
