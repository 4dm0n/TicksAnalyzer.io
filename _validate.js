const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');
const idx = h.indexOf('<script>');
const end = h.indexOf('</script>', idx);
const js = h.slice(idx + 8, end);

const ob = (js.match(/{/g) || []).length;
const cb = (js.match(/}/g) || []).length;
console.log('{ count:', ob, '} count:', cb, 'diff:', ob - cb);

const op = (js.match(/\(/g) || []).length;
const cp = (js.match(/\)/g) || []).length;
console.log('(' + ' count:', op, ') count:', cp, 'diff:', op - cp);

const obk = (js.match(/\[/g) || []).length;
const cbk = (js.match(/\]/g) || []).length;
console.log('[ count:', obk, '] count:', cbk, 'diff:', obk - cbk);
