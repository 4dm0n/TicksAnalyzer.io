const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');
const idx = h.indexOf('<script>');
const end = h.indexOf('</script>', idx);
let js = h.slice(idx + 8, end);

let i = 0;
let line = 1;
let state = 'code'; // code, single, double, template, templateExpr
let stack = [];

while (i < js.length) {
  const c = js[i];
  const two = js[i] + js[i+1];

  if (c === '\n') { line++; i++; continue; }

  if (state === 'code') {
    if (two === '//') { i += 2; continue; }
    if (two === '/*') { i += 2; while(i<js.length && !(js[i]==='*' && js[i+1]==='/')) { if(js[i]==='\n')line++; i++; } i+=2; continue; }
    if (c === "'") { state = 'single'; i++; continue; }
    if (c === '"') { state = 'double'; i++; continue; }
    if (c === '`') { state = 'template'; i++; continue; }
    if (c === '{') { stack.push({t:'{', line}); i++; continue; }
    if (c === '}') { if(stack.length) stack.pop(); else console.log('EXTRA } line',line); i++; continue; }
    i++; continue;
  }

  if (state === 'single') {
    if (c === '\\') { i += 2; continue; }
    if (c === "'") { state = 'code'; i++; continue; }
    i++; continue;
  }

  if (state === 'double') {
    if (c === '\\') { i += 2; continue; }
    if (c === '"') { state = 'code'; i++; continue; }
    i++; continue;
  }

  if (state === 'template') {
    if (two === '${') { state = 'templateExpr'; stack.push({t:'${', line}); i += 2; continue; }
    if (c === '`') { state = 'code'; i++; continue; }
    i++; continue;
  }

  if (state === 'templateExpr') {
    // inside ${...} — track braces, but strings/templates can nest
    if (two === '//') { i += 2; continue; }
    if (two === '/*') { i += 2; while(i<js.length && !(js[i]==='*' && js[i+1]==='/')) { if(js[i]==='\n')line++; i++; } i+=2; continue; }
    if (c === "'") { state = 'te-single'; i++; continue; }
    if (c === '"') { state = 'te-double'; i++; continue; }
    if (c === '`') { state = 'te-template'; i++; continue; }
    if (c === '{') { stack.push({t:'{', line}); i++; continue; }
    if (c === '}') {
      if (stack.length && stack[stack.length-1].t === '${') { stack.pop(); state = 'template'; i++; continue; }
      if (stack.length) stack.pop();
      i++; continue;
    }
    i++; continue;
  }

  if (state === 'te-single') {
    if (c === "\\") { i += 2; continue; }
    if (c === "'") { state = 'templateExpr'; i++; continue; }
    i++; continue;
  }

  if (state === 'te-double') {
    if (c === "\\") { i += 2; continue; }
    if (c === '"') { state = 'templateExpr'; i++; continue; }
    i++; continue;
  }

  if (state === 'te-template') {
    if (two === '${') { state = 'te-templateExpr'; stack.push({t:'${', line}); i += 2; continue; }
    if (c === '`') { state = 'templateExpr'; i++; continue; }
    i++; continue;
  }

  if (state === 'te-templateExpr') {
    if (two === '//') { i += 2; continue; }
    if (two === '/*') { i += 2; while(i<js.length && !(js[i]==='*' && js[i+1]==='/')) { if(js[i]==='\n')line++; i++; } i+=2; continue; }
    if (c === "'") { state = 'te2-single'; i++; continue; }
    if (c === '"') { state = 'te2-double'; i++; continue; }
    if (c === '`') { state = 'te2-template'; i++; continue; }
    if (c === '{') { stack.push({t:'{', line}); i++; continue; }
    if (c === '}') {
      if (stack.length && stack[stack.length-1].t === '${') { stack.pop(); state = 'te-template'; i++; continue; }
      if (stack.length) stack.pop();
      i++; continue;
    }
    i++; continue;
  }

  if (state === 'te2-single') {
    if (c === "\\") { i += 2; continue; }
    if (c === "'") { state = 'te-templateExpr'; i++; continue; }
    i++; continue;
  }
  if (state === 'te2-double') {
    if (c === "\\") { i += 2; continue; }
    if (c === '"') { state = 'te-templateExpr'; i++; continue; }
    i++; continue;
  }
  if (state === 'te2-template') {
    if (two === '${') { state = 'te2-templateExpr'; stack.push({t:'${', line}); i += 2; continue; }
    if (c === '`') { state = 'te-templateExpr'; i++; continue; }
    i++; continue;
  }

  if (state === 'te2-templateExpr') {
    if (c === "'") { state = 'te3-single'; i++; continue; }
    if (c === '"') { state = 'te3-double'; i++; continue; }
    if (c === '`') { state = 'te3-template'; i++; continue; }
    if (c === '{') { stack.push({t:'{', line}); i++; continue; }
    if (c === '}') {
      if (stack.length && stack[stack.length-1].t === '${') { stack.pop(); state = 'te2-template'; i++; continue; }
      if (stack.length) stack.pop();
      i++; continue;
    }
    if (c === '\n') line++;
    i++; continue;
  }

  console.log('UNHANDLED state', state, 'at line', line);
  break;
}

console.log('Final state:', state);
console.log('Stack remaining:');
stack.forEach(s => console.log('  ', JSON.stringify(s)));
