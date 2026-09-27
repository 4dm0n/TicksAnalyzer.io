const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');
const idx = h.indexOf('<script>');
const end = h.indexOf('</script>', idx);
let js = h.slice(idx + 8, end);
const lines = js.split('\n');

let stack = [];
let lineNo = 0;
let i = 0;

function consumeString(start, quote) {
  let j = start + 1;
  while (j < js.length) {
    if (js[j] === '\\') { j += 2; continue; }
    if (js[j] === quote) return j + 1;
    if (js[j] === '\n') lineNo++;
    j++;
  }
  return j;
}

while (i < js.length) {
  const ch = js[i];

  if (js[i] === '\n') { lineNo++; i++; continue; }
  if (ch === ' ' || ch === '\t' || ch === '\r') { i++; continue; }

  if (ch === '/' && js[i + 1] === '/') {
    while (i < js.length && js[i] !== '\n') i++;
    continue;
  }
  if (ch === '/' && js[i + 1] === '*') {
    i += 2;
    while (i < js.length && !(js[i] === '*' && js[i + 1] === '/')) {
      if (js[i] === '\n') lineNo++;
      i++;
    }
    i += 2;
    continue;
  }

  if (ch === '"' || ch === "'") {
    i = consumeString(i, ch);
    continue;
  }

  // template literal
  if (ch === '`') {
    i++;
    while (i < js.length && js[i] !== '`') {
      if (js[i] === '\\') { i += 2; continue; }
      if (js[i] === '\n') lineNo++;
      if (js[i] === '$' && js[i + 1] === '{') {
        // expression inside template - count braces
        i += 2;
        stack.push({ type: '${', line: lineNo });
        while (i < js.length) {
          const c = js[i];
          if (c === '\n') { lineNo++; i++; continue; }
          if (c === '"' || c === "'") { i = consumeString(i, c); continue; }
          if (c === '`') { break; }
          if (c === '{') { stack.push({ type: 'inner', line: lineNo }); i++; continue; }
          if (c === '}') {
            if (stack.length && stack[stack.length - 1].type === '${') {
              stack.pop();
              i++;
              break;
            } else if (stack.length) {
              stack.pop();
            }
            i++;
            continue;
          }
          i++;
        }
        continue;
      }
      i++;
    }
    i++; // skip closing backtick
    continue;
  }

  if (ch === '{') { stack.push({ type: '{', line: lineNo }); i++; continue; }
  if (ch === '}') {
    if (stack.length) stack.pop();
    else console.log('EXTRA } at line', lineNo);
    i++;
    continue;
  }

  i++;
}

console.log('Stack remaining (unclosed):');
stack.forEach(s => console.log('  ' + JSON.stringify(s)));
