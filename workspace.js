/* Local workspace controls; no framework, external icon font or account needed. */
function wilsonInterval(successes, count) {
    if (!count) return [0, 1];
    const z = 1.96, p = successes / count, denominator = 1 + z*z/count;
    const centre = (p + z*z/(2*count)) / denominator;
    const margin = z * Math.sqrt(p*(1-p)/count + z*z/(4*count*count)) / denominator;
    return [Math.max(0, centre-margin), Math.min(1, centre+margin)];
}

function updateSignal() {
    const count = ticks.length;
    const raw = document.getElementById('trade-thold').value;
    const n = Number(raw);
    const valid = raw !== '' && Number.isInteger(n) && n >= 0 && n < 9;
    const ready = count === 200 && valid;
    latestSignal = null;
    document.getElementById('window-count').textContent = count + ' / 200 · Tick ' + totalTicks;
    document.getElementById('window-progress').value = count;
    const summary = document.getElementById('signal-summary');
    const confidence = document.getElementById('confidence');
    confidence.value = '—';
    if (ready) {
        const overCount = ticks.filter(d => d > n).length;
        const theoreticalOver = (9-n)/10;
        const type = overCount/count > theoreticalOver ? 'over' : 'under';
        const hits = type === 'over' ? overCount : count-overCount;
        const observed = hits/count;
        const baseline = getWinProbability(type,n);
        const [low, high] = wilsonInterval(hits,count);
        // Compare a single user-selected threshold with its own theoretical baseline.
        // A high raw percentage alone does not qualify as a signal.
        const qualified = low > baseline;
        latestSignal = {type,n,observed,baseline,low,high,qualified};
        confidence.value = (observed*100).toFixed(1) + '%';
        summary.textContent = qualified ? (type === 'over' ? '↑ OVER > ' : '↓ UNDER ≤ ') + n + ' · Sesgo observado' : 'Sin señal clara para el umbral ' + n;
        document.getElementById('signal-explanation').textContent = type.toUpperCase() + ' ' + n + ': ' + hits + '/200 · Frecuencia ' + (observed*100).toFixed(1) + '% · Base teórica ' + (baseline*100).toFixed(0) + '% · Intervalo Wilson 95%: ' + (low*100).toFixed(1) + '–' + (high*100).toFixed(1) + '%. No es una probabilidad predictiva ni una garantía de ganancia.';
    } else {
        summary.textContent = !valid ? 'Selecciona un umbral de 0 a 8 para analizar ambas direcciones.' : 'Recopilando datos: faltan ' + (200-count) + ' ticks.';
        document.getElementById('signal-explanation').textContent = 'A partir de 200 ticks, cada tick nuevo sustituye al más antiguo. Confidence muestra la frecuencia de la dirección analizada; no predice el siguiente tick.';
    }
    document.getElementById('signal-digits').innerHTML = digitCounts.map((frequency,digit) => {
        const active = latestSignal?.qualified && digit === n;
        const arrow = active ? (latestSignal.type === 'over' ? '↑' : '↓') : '·';
        return '<div class="signal-digit' + (active ? ' suggested' : '') + '"><span class="signal-arrow" aria-label="' + (active ? latestSignal.type.toUpperCase() + ' umbral ' + digit : 'Sin señal') + '">' + arrow + '</span><strong>' + digit + '</strong><small>' + (count ? frequency/count*100 : 0).toFixed(1) + '%</small></div>';
    }).join('');
}

const helpContent = {
    symbol: ['Activo', 'Selecciona el mercado que suministra los ticks. Cambiar de activo reinicia la ventana; una operación pendiente se anula y su apuesta se devuelve.', 'Ejemplo: Volatility 10.'],
    'real-price': ['Precio actual', 'Última cotización recibida de Deriv. Es de solo lectura. El último dígito se obtiene respetando la precisión indicada por el proveedor.', 'Ejemplo: 123.40 produce el dígito 0, no el 4.'],
    'trade-type': ['Predicción', 'OVER gana si el último dígito es mayor que el umbral. UNDER gana si es menor o igual. Esta es la regla del simulador y no un contrato real de Deriv.', 'Ejemplo: OVER 5 gana con 6, 7, 8 o 9; UNDER 5 con 0 a 5. La resolución ocurre en el tercer tick posterior a la entrada.'],
    'trade-thold': ['Umbral', 'Número con el que se compara el dígito al liquidar la operación. El análisis compara la frecuencia observada con la base teórica de ese mismo umbral.', 'Ejemplo: OVER 0 tiene una base de 90%; un 60% observado no sería una señal favorable. El umbral 9 no permite una operación útil.'],
    'trade-stake': ['Apuesta', 'Importe simulado reservado al abrir. El saldo disponible baja inmediatamente. Al ganar se devuelve la apuesta más el beneficio; al perder no se descuenta otra vez.', 'Ejemplo: saldo $100, apuesta $10 → disponible $90. OVER 4 ganado devuelve $20 → saldo $110.'],
    'trade-tp': ['Take profit', 'Detiene la sesión y el bot cuando el beneficio neto acumulado alcanza este importe. Se conserva al reconectar. Cero desactiva el objetivo.', 'Ejemplo: 20 detiene la sesión al alcanzar al menos $20 de PnL.'],
    confidence: ['Confidence · frecuencia observada', 'Campo automático y de solo lectura. Muestra cuántos de los últimos 200 dígitos cumplen la dirección analizada. La flecha aparece cuando el límite inferior del intervalo Wilson de 95% supera la probabilidad teórica del umbral elegido. No significa 95% de probabilidad de ganar. Las ventanas se solapan y observar muchas ventanas puede producir señales por azar.', 'Ejemplo: OVER 5 cumple en 110 de 200 ticks: frecuencia 55%, base 40%, intervalo aproximado 48.1–61.7%. Es una desviación histórica, no una predicción validada.'],
    'theme-select': ['Tema', 'Cambia los colores de la interfaz. Los estados de las operaciones mantienen siempre azul, verde y rojo.', 'Ejemplo: White usa superficies claras; Ocean, tonos azules.'],
    'btn-martingala': ['Martingala', 'Duplica la siguiente apuesta tras perder y vuelve a la apuesta base al ganar. No aumenta la probabilidad de acierto. Se rechazan importes superiores al saldo disponible.', 'Ejemplo: base $2 → pérdida → siguiente apuesta $4.'],
    'btn-autobot': ['Bot automático', 'Solo abre operaciones simuladas al completar 200 ticks y existir una señal del umbral configurado. Usa la misma señal visible y nunca abre dos operaciones a la vez.', 'Ejemplo: flecha ↑ sobre 5 → operación OVER 5. Una señal histórica no garantiza rentabilidad.'],
    'acc-balance': ['Saldo disponible', 'Saldo simulado libre después de reservar la operación abierta. PnL contiene solo resultados liquidados. Detener o perder la conexión anula la operación pendiente y devuelve su apuesta. El historial y la cuenta viven en esta pestaña; solo el orden y el tema se guardan.', 'Ejemplo: $100 disponibles, apuesta $10, pérdida → $90.'],
    'acc-pnl': ['PnL', 'Suma de ganancias y pérdidas liquidadas. No incluye apuestas abiertas. Los pagos son teóricos del simulador, sin comisiones, y no cotizaciones reales de Deriv.', 'Ejemplo: +$10 y −$4 → PnL +$6.'],
    'acc-won': ['Ganadas', 'Número de operaciones liquidadas con resultado ganador. No cuenta operaciones abiertas ni anuladas.', 'Ejemplo: dos cierres ganadores → 2.'],
    'acc-lost': ['Perdidas', 'Número de operaciones liquidadas con resultado perdedor. Una cancelación no cuenta como pérdida.', 'Ejemplo: una pérdida y una anulación → 1.']
};

const iconPaths = {
    info:'M12 11v6 M12 7h.01',
    up:'M12 19V5 M5 12l7-7 7 7',
    down:'M12 5v14 M5 12l7 7 7-7',
    grip:'M9 5h.01 M15 5h.01 M9 12h.01 M15 12h.01 M9 19h.01 M15 19h.01'
};
function uiIcon(name) {
    return '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (name === 'info' ? '<circle cx="12" cy="12" r="9"/>' : '') + '<path d="' + iconPaths[name] + '"/></svg>';
}

const helpDialog = document.createElement('dialog');
helpDialog.className = 'help-dialog';
helpDialog.setAttribute('aria-labelledby','help-title');
helpDialog.innerHTML = '<form method="dialog"><button class="help-close" aria-label="Cerrar ayuda">✕</button></form><h2 id="help-title"></h2><p id="help-body"></p><p id="help-example"></p>';
document.body.append(helpDialog);
helpDialog.addEventListener('click', event => { if(event.target === helpDialog) { const r=helpDialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)helpDialog.close(); } });
function showFieldHelp(id) {
    const [title,body,example] = helpContent[id];
    document.getElementById('help-title').textContent=title;
    document.getElementById('help-body').textContent=body;
    document.getElementById('help-example').textContent=example;
    helpDialog.showModal();
}
Object.keys(helpContent).forEach(id => {
    const control = document.getElementById(id);
    const label = document.querySelector('label[for="'+id+'"]') || control?.previousElementSibling;
    if (!label) return;
    const button=document.createElement('button');
    button.type='button'; button.className='info-button'; button.innerHTML=uiIcon('info');
    button.setAttribute('aria-label','Información: '+helpContent[id][0]);
    button.addEventListener('click',()=>showFieldHelp(id));
    // Keep information buttons outside labels so they don't activate the input.
    const wrapper=document.createElement('span'); wrapper.className='field-label';
    label.replaceWith(wrapper); wrapper.append(label,button);
});

// All main sections share a container, allowing every section to change position.
const workspace = document.querySelector('.main');
const side = document.querySelector('.right-panel');
workspace.append(...side.children); side.remove();
const signals=document.querySelector('.signal-panel');
workspace.insertBefore(signals, workspace.children[1]);
const sectionDefinitions = [
    ['digits','.digits-panel','Gráficos y estadísticas'],
    ['signals','.signal-panel','Señales'],
    ['history','.trade-history-panel','Historial'],
    ['account','.account-summary','Cuenta'],
    ['terminal','.terminal-panel','Terminal']
];
function saveSectionOrder() {
    try { localStorage.setItem('moyaSectionOrder', JSON.stringify([...workspace.children].map(el=>el.dataset.section))); }
    catch (_) { showToast('No se pudo guardar el orden en este navegador.', 'error'); }
}
sectionDefinitions.forEach(([id,selector,name])=>{
    const section=document.querySelector(selector); section.dataset.section=id;
    const bar=document.createElement('div'); bar.className='section-tools';
    bar.innerHTML='<span>'+name+'</span><button type="button" class="drag-handle" aria-label="Mover '+name+'" title="Arrastra para mover. Con teclado, usa las flechas arriba y abajo.">⠿</button>';
    section.prepend(bar);
    bar.querySelector('.drag-handle').innerHTML=uiIcon('grip');
    const handle=bar.querySelector('.drag-handle');
    handle.addEventListener('keydown',event=>{
        if(!['ArrowUp','ArrowDown'].includes(event.key))return;
        event.preventDefault();
        const next=event.key==='ArrowDown';
        const sibling=next?section.nextElementSibling:section.previousElementSibling;
        if(!sibling)return;
        if(next)workspace.insertBefore(sibling,section);else workspace.insertBefore(section,sibling);
        saveSectionOrder();handle.focus();handle.scrollIntoView({block:'nearest'});
        showToast(name+' movido. Orden guardado.');
    });
    let pointer=null, target=null, frame=null;
    function trackTarget() {
        target?.classList.remove('drop-target');
        const hit=document.elementFromPoint(pointer.x,pointer.y)?.closest('[data-section]');
        target=hit?.parentElement===workspace&&hit!==section?hit:null;
        target?.classList.add('drop-target');
    }
    function autoScroll() {
        if(!pointer?.moving)return;
        const speed=pointer.y<70?-12:pointer.y>window.innerHeight-70?12:0;
        if(speed){window.scrollBy(0,speed);trackTarget();}
        frame=requestAnimationFrame(autoScroll);
    }
    function finish(cancelled=false) {
        if(!pointer)return;
        const destination=pointer.moving&&!cancelled?target:null;
        const pointerId=pointer.id;
        pointer=null;cancelAnimationFrame(frame);
        target?.classList.remove('drop-target');target=null;
        section.classList.remove('section-dragging');
        if(handle.hasPointerCapture(pointerId))handle.releasePointerCapture(pointerId);
        if(!destination)return;
        const children=[...workspace.children];
        workspace.insertBefore(section,children.indexOf(section)<children.indexOf(destination)?destination.nextSibling:destination);
        saveSectionOrder();handle.focus({preventScroll:true});
        showToast(name+' movido. Orden guardado.');
    }
    handle.addEventListener('pointerdown',event=>{
        if(event.button!==0||!event.isPrimary)return;
        pointer={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moving:false};
        handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener('pointermove',event=>{
        if(!pointer||event.pointerId!==pointer.id)return;
        pointer.x=event.clientX;pointer.y=event.clientY;
        if(!pointer.moving&&Math.hypot(pointer.x-pointer.startX,pointer.y-pointer.startY)>6){
            pointer.moving=true;section.classList.add('section-dragging');autoScroll();
        }
        if(pointer.moving)trackTarget();
    });
    handle.addEventListener('pointerup',()=>finish());
    handle.addEventListener('pointercancel',()=>finish(true));
    handle.addEventListener('lostpointercapture',()=>finish(true));
});
try {
    const saved=JSON.parse(localStorage.getItem('moyaSectionOrder') || 'null');
    if(Array.isArray(saved)) [...new Set(saved)].forEach(id=>{
        const section=[...workspace.children].find(el=>el.dataset.section===id);
        if(section)workspace.append(section);
    });
} catch (_) { /* Ignore unavailable storage and malformed saved layouts. */ }
['trade-thold','trade-type'].forEach(id=>document.getElementById(id).addEventListener('input',updateSignal));
updateSignal();
