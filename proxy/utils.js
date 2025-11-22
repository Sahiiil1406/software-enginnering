import fs from 'fs';


export function writeJSON(path, entry) {
let arr = [];
if (fs.existsSync(path)) {
arr = JSON.parse(fs.readFileSync(path));
}
arr.push(...entry);
fs.writeFileSync(path, JSON.stringify(arr, null, 2));
}