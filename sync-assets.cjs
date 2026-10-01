// Optional maintenance helper. The generated index.html works on its own.
// Run after editing glass.css or workspace.js: node sync-assets.cjs
const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const assets = [
    {name:'glass.css', tag:'style', legacy:'<link rel="stylesheet" href="glass.css">'},
    {name:'workspace.js', tag:'script', legacy:'<script src="workspace.js"></script>'}
];
for (const {name, tag, legacy} of assets) {
    const start = `<!-- embedded:${name}:start -->`;
    const end = `<!-- embedded:${name}:end -->`;
    const content = fs.readFileSync(name, 'utf8');
    if (new RegExp(`</${tag}`, 'i').test(content)) throw new Error(`Unsafe closing tag in ${name}`);
    const block = `${start}\n<${tag} data-source="${name}">\n${content}\n</${tag}>\n${end}`;
    const first = html.indexOf(start);
    if (first >= 0) {
        const last = html.indexOf(end, first);
        if (last < 0) throw new Error(`Missing end marker for ${name}`);
        html = html.slice(0, first) + block + html.slice(last + end.length);
    } else if (html.includes(legacy)) {
        html = html.replace(legacy, () => block);
    } else {
        throw new Error(`Missing insertion point for ${name}`);
    }
}
fs.writeFileSync('index.html', html);
console.log('index.html actualizado: estilos e iconos integrados, sin recursos locales externos.');
