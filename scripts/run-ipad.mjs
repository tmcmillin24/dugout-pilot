import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function assertUniversal(families) {
  if (!Array.isArray(families) || !families.includes(1) || !families.includes(2)) {
    throw new Error(`The compiled app is not universal (UIDeviceFamily=${JSON.stringify(families)}). Refusing to install an iPhone-only app on iPad.`);
  }
}
function run(command, args, capture = false) {
  const result = spawnSync(command, args, { stdio: capture ? 'pipe' : 'inherit', encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(capture ? result.stderr || `${command} failed.` : `${command} failed. See the error above.`);
  return result.stdout;
}
function findApp(folder) {
  for (const item of readdirSync(folder, { withFileTypes: true })) {
    if (!item.isDirectory()) continue;
    const path = join(folder, item.name);
    if (item.name.endsWith('.app')) return path;
    const nested = findApp(path); if (nested) return nested;
  }
}
function main() {
  if (process.platform !== 'darwin') throw new Error('Run this command on your Mac with Xcode installed.');
  process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
  const config = JSON.parse(readFileSync('app.json', 'utf8')).expo;
  if (config.ios?.supportsTablet !== true) throw new Error('ios.supportsTablet must be true.');
  const devices = JSON.parse(run('xcrun', ['simctl', 'list', 'devices', 'booted', '--json'], true));
  const ipads = Object.values(devices.devices).flat().filter(device => device.state === 'Booted' && /iPad/i.test(device.name));
  if (ipads.length !== 1) throw new Error('Open exactly one iPad simulator (11-inch or 13-inch), then run this command again. Other iPhone simulators can remain open.');
  const ipad = ipads[0];
  const output = mkdtempSync(join(tmpdir(), 'dugout-universal-ipad-'));
  console.log(`Building a verified universal app for ${ipad.name}. Native ios files will be regenerated from app.json.`);
  run('npx', ['expo', 'prebuild', '--platform', 'ios', '--clean']);
  run('npx', ['expo', 'run:ios', '--device', 'generic', '--no-build-cache', '--no-bundler', '--port', '8083', '--output', output]);
  const app = findApp(output);
  if (!app) throw new Error('No compiled .app was found in the build output.');
  const plist = JSON.parse(run('plutil', ['-convert', 'json', '-o', '-', join(app, 'Info.plist')], true));
  assertUniversal(plist.UIDeviceFamily);
  console.log('VERIFIED: compiled app supports iPhone (1) and iPad (2). Installing this exact binary.');
  run('npx', ['expo', 'run:ios', '--binary', app, '--device', ipad.udid, '--port', '8083']);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
