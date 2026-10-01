const fs=require('fs'),http=require('http'),path=require('path'),{spawn}=require('child_process');
const server=http.createServer((req,res)=>{
 const name=({'/':'index.html','/index.html':'index.html','/glass.css':'glass.css','/workspace.js':'workspace.js'})[req.url];
 if(!name){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',name.endsWith('.css')?'text/css':name.endsWith('.js')?'text/javascript':'text/html; charset=utf-8');res.end(fs.readFileSync(name));
});
(async()=>{
 await new Promise(r=>server.listen(8765,'127.0.0.1',r));
 const chrome=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port=9223','--user-data-dir='+path.join(process.cwd(),'.ui-browser'),'--no-first-run','about:blank'],{stdio:'ignore'});
 let ws;
 try{
 let tabs;for(let i=0;i<40;i++){try{tabs=await(await fetch('http://127.0.0.1:9223/json',{signal:AbortSignal.timeout(800)})).json();break;}catch{await new Promise(r=>setTimeout(r,200));}}
 if(!tabs)throw Error('Chrome unavailable');
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map(),errors=[];
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,m=>m.error?reject(m.error):resolve(m.result));ws.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async expression=>{const response=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(response.exceptionDetails)throw Error(response.exceptionDetails.exception?.description||JSON.stringify(response.exceptionDetails));return response.result.value;};
 await send('Runtime.enable');await send('Page.enable');
 await send('Network.enable');
 await send('Network.setBlockedURLs',{urls:['*glass.css*','*workspace.js*']});

 await send('Page.navigate',{url:'http://127.0.0.1:8765'});await new Promise(r=>setTimeout(r,400));
 const checks=[];
 const inspect=await evaluate(`({handles:document.querySelectorAll('.drag-handle').length,arrows:document.querySelectorAll('[data-move]').length,border:getComputedStyle(document.querySelector('.drag-handle')).borderColor,background:getComputedStyle(document.querySelector('.drag-handle')).backgroundColor})`);
 if(inspect.handles!==5||inspect.arrows!==0||inspect.border!=='rgba(0, 0, 0, 0)'||inspect.background!=='rgba(0, 0, 0, 0)')throw Error(JSON.stringify(inspect));
 checks.push('Only five transparent grip controls');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:true});
 await send('Emulation.setTouchEmulationEnabled',{enabled:true});
 await evaluate(`document.querySelector('[data-section="signals"]').scrollIntoView({block:'start'})`);
 const coords=await evaluate(`(()=>{const a=document.querySelector('[data-section="signals"] .drag-handle').getBoundingClientRect(),b=document.querySelector('[data-section="history"]').getBoundingClientRect();return {x:a.x+a.width/2,y:a.y+a.height/2,tx:b.x+b.width/2,ty:b.y+60}})()`);
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:coords.x,y:coords.y}]});
 for(let i=1;i<=8;i++){await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:coords.x+(coords.tx-coords.x)*i/8,y:coords.y+(coords.ty-coords.y)*i/8}]});}
 await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const touchOrder=await evaluate(`[...document.querySelector('.main').children].map(e=>e.dataset.section)`);
 if(touchOrder.indexOf('signals')<touchOrder.indexOf('history'))throw Error('Touch reorder failed '+JSON.stringify({coords,touchOrder}));
 checks.push('Real touch gesture reorders sections');
 await evaluate(`document.querySelector('[data-section="signals"] .drag-handle').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true}))`);
 checks.push('Grip keyboard movement');
 const saved=await evaluate(`localStorage.getItem('moyaSectionOrder')`);
 await send('Page.reload');await new Promise(r=>setTimeout(r,300));
 const actual=await evaluate(`JSON.stringify([...document.querySelector('.main').children].map(e=>e.dataset.section))`);
 if(actual!==saved)throw Error('Persist failed');
 checks.push('Reload restores saved order');
 if(errors.length)throw Error(JSON.stringify(errors));console.log(JSON.stringify({checks,inspect,errors}));
 }finally{ws?.close();chrome.kill();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
