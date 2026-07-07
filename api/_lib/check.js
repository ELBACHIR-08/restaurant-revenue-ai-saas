const fs = require('fs');
const path = require('path');
const root = process.cwd();
const jsFiles = [];
function walk(dir) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (item.endsWith('.js')) jsFiles.push(full);
  }
}
walk(path.join(root, 'api'));
for (const file of jsFiles) {
  require('child_process').execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}
console.log(`Checked ${jsFiles.length} API files.`);
