const fs = require('fs');
const vm = require('vm');
const h = fs.readFileSync('index.html', 'utf8');
const idx = h.indexOf('<script>');
const end = h.indexOf('</script>', idx);
const js = h.slice(idx + 8, end);

try {
  new vm.Script(js, { filename: 'script.js' });
  console.log('vm parse: OK (no syntax errors)');
} catch (e) {
  console.log('vm ERROR:', e.message);
  if (e.stack) console.log(e.stack.split('\n').slice(0, 6).join('\n'));
}
