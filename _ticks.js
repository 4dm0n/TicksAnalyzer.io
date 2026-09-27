const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');
const idx = h.indexOf('<script>');
const end = h.indexOf('</script>', idx);
let js = h.slice(idx + 8, end);

let count = 0;
let i = 0;
let inStr = null;
let line = 1;
while (i < js.length) {
  const c = js[i];
  if (c === '\n') line++;
  if (inStr) {
    if (c === '\\') { i += 2; continue; }
    if (c === inStr) { inStr = null; }
    i++; continue;
  }
  if (c === '"' || c === "'") { inStr = c; i++; continue; }
  if (c === '`') { count++; console.log('backtick #' + count + ' at line ' + line); }
  i++;
}
console.log('Total backticks:', count);
