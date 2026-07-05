import fs from 'node:fs';
const required = ['index.html','package.json','vercel.json','api/health.js','api/signup.js'];
let ok = true;
for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${file}`);
    ok = false;
  }
}
if (!ok) process.exit(1);
console.log('Production Core structure OK');
