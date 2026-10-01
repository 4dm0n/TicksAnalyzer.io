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
 const injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.WebSocket=class {static OPEN=1;constructor(url){this.url=url;this.readyState=1;setTimeout(()=>this.onopen?.(),0);}send(){}close(){this.readyState=3;this.onclose?.({code:1000});}};`});
 await send('Page.navigate',{url:'http://127.0.0.1:8765'});await new Promise(r=>setTimeout(r,500));
 const results=await evaluate(`(()=>{
 const checks=[];const check=(name,condition)=>{if(!condition)throw Error(name);checks.push(name);};
 const field=(id,value)=>document.getElementById(id).value=value;
 check('standalone HTML has no companion requests',!document.querySelector('link[href="glass.css"],script[src="workspace.js"]'));
 check('embedded styles and icons load with companion files blocked',document.querySelectorAll('.ui-icon').length===29&&getComputedStyle(document.querySelector('.top-bar')).display==='grid');
 start(); const feed=d=>processTick(d,100+d/100);
 for(let i=0;i<200;i++)feed(i%10);
 check('200 ticks and neutral window',totalTicks===200&&ticks.length===200&&!latestSignal.qualified);
 field('trade-type','over');field('trade-thold','4');field('trade-stake','10');
 openTrade();check('open is blue and reserves stake',accountBalance===990&&tradeHistory[0].status==='open'&&document.querySelector('tr.open'));
 feed(9);feed(9);check('not settled before third tick',trade!==null);feed(9);
 check('win settles past tick 200 exactly once',trade===null&&accountBalance===1010&&totalProfit===10&&tradeHistory.length===1&&tradeHistory[0].status==='won');
 resolveTrade(true,9);check('duplicate settlement ignored',accountBalance===1010);
 openTrade();feed(0);feed(0);feed(0);check('loss not debited twice',accountBalance===1000&&totalProfit===0&&tradeHistory[0].status==='lost');
 openTrade();clearTradeHistory();check('clearing history retains open trade',tradeHistory.length===1&&tradeHistory[0].status==='open');stop();
 check('stop refunds and cancels',accountBalance===1000&&tradeHistory[0].status==='cancelled'&&!trade);
 start();for(let i=0;i<200;i++)feed(9);
 check('signal after warmup',latestSignal.qualified&&latestSignal.type==='over'&&document.querySelectorAll('.suggested').length===1);
 const before=totalTicks;feed(0);check('rolling window keeps updating',totalTicks===before+1&&ticks.length===200&&latestSignal.observed===.995);
 field('trade-stake','1001');openTrade();check('insufficient funds blocked',!trade&&accountBalance===1000);
 field('trade-stake','10');field('trade-thold','9');openTrade();check('impossible threshold blocked',!trade);
 field('trade-thold','0');updateSignal();check('zero threshold preserved',latestSignal.n===0);
 field('trade-thold','4');openTrade();const old=ws;old.onclose({code:1006});
 check('disconnect refund',!trade&&accountBalance===1000&&tradeHistory[0].status==='cancelled');
 stop();start();const tickSocket=ws;tickSocket.onmessage({data:JSON.stringify({tick:{quote:123.4,pip_size:2}})});check('trailing zero precision',ticks[0]===0);
 stop();document.getElementById('acc-balance').dispatchEvent(new MouseEvent('dblclick'));
 const edit=document.querySelector('.balance-input');edit.value='250';edit.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}));
 check('balance edit reflected immediately',accountBalance===250&&document.getElementById('acc-balance').textContent==='$250.00');
 start();for(let i=0;i<200;i++)feed(i%10);
 field('trade-type','under');field('trade-thold','0');field('trade-stake','2');
 toggleMartingala();openTrade();feed(9);feed(9);feed(9);
 check('martingale loss uses configured base',lastMartingalaStake===4&&accountBalance===248);
 openTrade();check('martingale reserves doubled stake',trade.stake===4&&accountBalance===244);
 feed(0);feed(0);feed(0);check('under zero payout and martingale reset',accountBalance===284&&lastMartingalaStake===2&&totalProfit===34);
 toggleMartingala();field('trade-tp','35');field('trade-thold','4');field('trade-type','over');
 openTrade();feed(9);feed(9);feed(9);check('take profit stops session',!isRunning&&totalProfit===36&&accountBalance===286);
 field('trade-tp','0');toggleAutoBot();start();for(let i=0;i<199;i++)feed(9);
 check('bot waits for 200 ticks',!trade);feed(9);check('bot uses displayed signal',trade&&trade.type===latestSignal.type);
 stop();toggleAutoBot();
 check('donut segments have visible geometry',[...document.querySelectorAll('.donut-svg path')].every(p=>p.getAttribute('d')?.includes('A'))&&document.querySelectorAll('.donut-svg path').length>0);
 showFieldHelp('confidence');check('help modal opens',document.querySelector('dialog').open);document.querySelector('dialog').close();
 document.querySelector('[data-section="digits"] [data-move="1"]').click();check('section position stored',JSON.parse(localStorage.getItem('moyaSectionOrder'))[0]==='signals');
 return checks;
})()`);
 await send('Page.reload');await new Promise(r=>setTimeout(r,400));
 if(!await evaluate("document.querySelector('.main').firstElementChild.dataset.section==='signals'"))throw Error('Order restore failed');
 const layout=[];
 for(const width of [320,390,768,1024,1440,1920]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<700});
 for(const theme of ['matrix','dark','purple','ocean','white']){
 await evaluate(`applyTheme('${theme}')`);await new Promise(r=>setTimeout(r,30));
 const overflow=await evaluate('document.documentElement.scrollWidth>innerWidth');layout.push({width,theme,overflow});if(overflow)throw Error('Overflow '+width+' '+theme);
 }
 }
 await evaluate("start();for(let i=0;i<200;i++)processTick(i%3?9:0,123.49);document.getElementById('trade-thold').value='4';document.getElementById('trade-stake').value='10';openTrade();processTick(9,123.49);processTick(9,123.49);processTick(9,123.49);openTrade();processTick(0,123.40);processTick(0,123.40);processTick(0,123.40);openTrade();applyTheme('white');");
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync('workspace-preview.png',Buffer.from(shot.data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 const mobileShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync('workspace-mobile.png',Buffer.from(mobileShot.data,'base64'));
 const colorChecks=await evaluate(`(()=>{const results=[];for(const theme of ['matrix','dark','purple','ocean','white']){applyTheme(theme);const colors=['open','won','lost'].map(s=>getComputedStyle(document.querySelector('tr.'+s+' td')).color);results.push({theme,colors});}return results;})()`);
 if(errors.length)throw Error(JSON.stringify(errors));
 await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});
 await send('Page.reload');await new Promise(r=>setTimeout(r,400));
 const live=await evaluate(`new Promise(resolve=>{start();const began=Date.now();const poll=setInterval(()=>{if(totalTicks>0||Date.now()-began>18000){clearInterval(poll);const result={ticks:totalTicks,connected:totalTicks>0,lastPrice:currentPrice};stop();resolve(result);}},250);})`);
 fs.writeFileSync('workspace-checks.json',JSON.stringify({checks:results,restoredOrder:true,layout,colorChecks,live,errors},null,2));
 console.log(JSON.stringify({checks:results,layoutCases:layout.length,colorChecks,live,errors},null,2));
 }finally{ws?.close();chrome.kill();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
