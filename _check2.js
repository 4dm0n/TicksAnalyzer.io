
let ticks = [];
let priceHistory = [];
let digitCounts = Array(10).fill(0);
let isRunning = false;
let currentPrice = 0;
let trade = null;
let wins = 0;
let losses = 0;
let martingala = false;
let tradeCount = 0;
let currentStreak = 0;
let lastMartingalaStake = 1;
let lastAnalysisTick = 0;
let accountBalance = 1000.00;
let totalProfit = 0;
let contractsWon = 0;
let contractsLost = 0;
let balanceEditing = false;

const symbols = {
    'R_10':  { name: 'Volatility 10',   decimals: 2 },
    'R_25':  { name: 'Volatility 25',   decimals: 2 },
    'R_50':  { name: 'Volatility 50',   decimals: 2 },
    'R_75':  { name: 'Volatility 75',   decimals: 2 },
    'R_100': { name: 'Volatility 100',  decimals: 2 },
    'BTCUSD':{ name: 'BTC/USD',         decimals: 2 }
};

let ws = null;

function start() {
    stop();
    ticks = [];
    digitCounts = Array(10).fill(0);
    priceHistory = [];
    wins = 0;
    losses = 0;
    tradeCount = 0;
    currentStreak = 0;
    lastMartingalaStake = 1;
    totalProfit = 0;
    contractsWon = 0;
    contractsLost = 0;
    isRunning = true;

    const sym = document.getElementById('symbol').value;
    const symInfo = symbols[sym];

    ws = new WebSocket('wss://api.derivws.com/trading/v1/options/ws/public');

    ws.onopen = function() {
        ws.send(JSON.stringify({
            ticks: sym,
            subscribe: 1
        }));
        log('<span class="green">Sesión iniciada: ' + symInfo.name + '</span>');
        log('<span class="gray">Conectado a Deriv vía WebSocket público (sin OAuth, sin API key)</span>');
    };

    ws.onmessage = function(event) {
        if (!isRunning) return;
        const data = JSON.parse(event.data);

        if (data.msg_type === 'tick' && data.tick) {
            const quote = data.tick.quote;
            const digit = parseInt(String(quote).slice(-1));

            if (!isNaN(digit)) {
                processTick(digit, quote);
            }
        }
    };

    ws.onerror = function(err) {
        log('<span class="red">Error de conexión: ' + err.message + '</span>');
    };

    ws.onclose = function() {
        if (isRunning) {
            setTimeout(() => {
                if (isRunning) start();
            }, 2000);
        }
    };

    document.getElementById('btn-start').disabled = true;
    document.getElementById('btn-stop').disabled = false;
    document.getElementById('btn-trade').disabled = false;
}

function processTick(digit, quote) {
    ticks.push(digit);
    digitCounts[digit]++;
    priceHistory.push(quote);
    currentPrice = quote;

    if (ticks.length > 200) {
        const old = ticks.shift();
        digitCounts[old]--;
    }
    if (priceHistory.length > 50) {
        priceHistory.shift();
    }

    const decimals = symbols[document.getElementById('symbol').value]?.decimals || 5;
    document.getElementById('real-price').value = quote.toFixed(decimals);

    updateDisplay();
    checkTrade(digit);

    if (ticks.length - lastAnalysisTick >= 30) {
        lastAnalysisTick = ticks.length;
        updateAnalysis();
    }
}

function updateDisplay() {
    updateDigitsChart();
    updateStats();
    updateTradeStatus();
}

function updateDigitsChart() {
    renderBarChart(document.getElementById('chart-bar'));
    updateBarLegend();
    renderDonutChart(document.getElementById('chart-donut'));
    updateDonutLegend();
    renderLineChart(document.getElementById('chart-line'));
    updateLineLegend();
}

function renderBarChart(container) {
    const total = ticks.length || 1;
    const maxCount = Math.max(...digitCounts, 1);
    const minCount = Math.min(...digitCounts);

    container.innerHTML = '';

    digitCounts.forEach((count, i) => {
        const barHeight = (count / maxCount) * 100;
        const isHot = count === maxCount && count > 0;
        const isCold = count === minCount && minCount < maxCount;

        const barDiv = document.createElement('div');
        barDiv.className = 'digit-bar';

        const innerBar = document.createElement('div');
        innerBar.className = 'bar';
        if (isHot) innerBar.classList.add('hot');
        else if (isCold) innerBar.classList.add('cold');
        innerBar.style.height = barHeight + '%';
        innerBar.title = `Dígito ${i}: ${count} ocurrencias`;

        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = i;

        barDiv.appendChild(innerBar);
        barDiv.appendChild(label);
        container.appendChild(barDiv);
    });
}

function updateBarLegend() {
    const total = ticks.length || 1;
    const legend = document.getElementById('chart-legend-bar');
    legend.innerHTML = `
        <span><span class="dot" style="background:#00ff7f"></span> Hot (más frecuente)</span>
        <span><span class="dot" style="background:#666"></span> Cold (menos frecuente)</span>
        <span><span class="dot" style="background:rgba(0,255,119,.15)"></span> Total: ${total} ticks</span>
    `;
}

function renderDonutChart(container) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const radius = 60;
    const centerX = 70;
    const centerY = 70;
    const colors = ['#ff4466', '#ff8c42', '#ffcc00', '#aadb00', '#00ff7f', '#00ff7f', '#00cc99', '#00aaff', '#44aaff', '#8888ff'];

    container.innerHTML = '';

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 140 140');
    svg.setAttribute('class', 'donut-svg');

    const total = digitCounts.reduce((a, b) => a + b, 0) || 1;

    let offset = 0;
    const sliceColor = '#444';
    digitCounts.forEach((count, i) => {
        const pct = count / total;
        const largeArc = pct > 0.5 ? 1 : 0;
        const startAngle = (offset * 2 * Math.PI) - Math.PI / 2;
        const endAngle = ((offset + pct) * 2 * Math.PI) - Math.PI / 2;

        const x1 = centerX + radius * Math.cos(startAngle);
        const y1 = centerY + radius * Math.sin(startAngle);
        const x2 = centerX + radius * Math.cos(endAngle);
        const y2 = centerY + radius * Math.sin(endAngle);

        const path = document.createElementNS(svgNS, 'path');
        if (count > 0) {
            path.setAttribute('fill', colors[i]);
        } else {
            path.setAttribute('fill', sliceColor);
            path.setAttribute('opacity', '0.35');
        }
        path.setAttribute('stroke', '#000');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('data-digit', i);
        path.setAttribute('data-count', count);
        path.setAttribute('data-pct', (pct * 100).toFixed(1));

        const title = document.createElementNS(svgNS, 'title');
        title.textContent = `Dígito ${i}: ${count} (${(pct * 100).toFixed(1)}%)`;
        path.appendChild(title);

        path.addEventListener('mouseenter', function(e) {
            showFloatTag(e, i, count, (pct * 100).toFixed(1));
        });
        path.addEventListener('mousemove', function(e) {
            moveFloatTag(e);
        });
        path.addEventListener('mouseleave', function() {
            hideFloatTag();
        });

        svg.appendChild(path);
        offset += pct;
    });

    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', centerX);
    label.setAttribute('y', centerY + 2);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', '#00ff7f');
    label.setAttribute('font-size', '15');
    label.setAttribute('font-weight', 'bold');
    label.textContent = ticks.length + ' ticks';
    svg.appendChild(label);

    const subLabel = document.createElementNS(svgNS, 'text');
    subLabel.setAttribute('x', centerX);
    subLabel.setAttribute('y', centerY + 18);
    subLabel.setAttribute('text-anchor', 'middle');
    subLabel.setAttribute('fill', '#66cc99');
    subLabel.setAttribute('font-size', '10');
    subLabel.textContent = `Total: ${total}`;
    svg.appendChild(subLabel);

    container.appendChild(svg);
}

function updateDonutLegend() {
    const total = ticks.length || 1;
    const colors = ['#ff4466', '#ff8c42', '#ffcc00', '#aadb00', '#00ff7f', '#00ff7f', '#00cc99', '#00aaff', '#44aaff', '#8888ff'];
    let html = '';
    digitCounts.forEach((count, i) => {
        const pct = total ? (count / total * 100).toFixed(1) : '0.0';
        html += `<span><span class="dot" style="background:${colors[i]}"></span> ${i}: ${count} (${pct}%)</span>`;
    });
    document.getElementById('chart-legend-donut').innerHTML = html;
}

function renderLineChart(container) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const prices = priceHistory.slice(-50);

    container.innerHTML = '';

    if (prices.length === 0) return;

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 940 250');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('class', 'line-svg');

    const margin = { top: 20, right: 60, bottom: 35, left: 45 };
    const w = 940 - margin.left - margin.right;
    const h = 250 - margin.top - margin.bottom;

    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('transform', `translate(${margin.left}, ${margin.top})`);

    const minPrice = Math.min(...prices) * 0.999;
    const maxPrice = Math.max(...prices) * 1.001;
    const priceRange = maxPrice - minPrice || 1;

    const yScale = (v) => h - ((v - minPrice) / priceRange) * h;
    const n = prices.length;

    const gridStep = 4;
    for (let i = 0; i <= gridStep; i++) {
        const val = minPrice + (priceRange * i / gridStep);
        const y = yScale(val);

        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', 0);
        line.setAttribute('y1', y);
        line.setAttribute('x2', w);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', 'rgba(0,255,119,0.08)');
        line.setAttribute('stroke-width', '1');
        g.appendChild(line);

        const lbl = document.createElementNS(svgNS, 'text');
        lbl.setAttribute('x', -6);
        lbl.setAttribute('y', y + 4);
        lbl.setAttribute('text-anchor', 'end');
        lbl.setAttribute('fill', '#00cc66');
        lbl.setAttribute('font-size', '9');
        lbl.textContent = val.toFixed(symbols[document.getElementById('symbol').value]?.decimals || 2);
        g.appendChild(lbl);
    }

    const decimals = symbols[document.getElementById('symbol').value]?.decimals || 5;
    let lastX = 0, lastY = 0;
    const points = [];
    prices.forEach((price, i) => {
        const x = (i / Math.max(n - 1, 1)) * w;
        const y = yScale(price);
        points.push({ x, y, price, prevPrice: i > 0 ? prices[i - 1] : price });
        lastX = x;
        lastY = y;
    });

    for (let i = 1; i < points.length; i++) {
        const p0 = points[i - 1];
        const p1 = points[i];
        const goingUp = p1.price >= p0.price;
        const segColor = goingUp ? '#00ff7f' : '#ff4466';

        const seg = document.createElementNS(svgNS, 'line');
        seg.setAttribute('x1', p0.x);
        seg.setAttribute('y1', p0.y);
        seg.setAttribute('x2', p1.x);
        seg.setAttribute('y2', p1.y);
        seg.setAttribute('stroke', segColor);
        seg.setAttribute('stroke-width', '2.5');
        seg.setAttribute('stroke-linecap', 'round');
        seg.setAttribute('title', `${p0.price.toFixed(decimals)} → ${p1.price.toFixed(decimals)} (${goingUp ? '↑' : '↓'})`);
        g.appendChild(seg);
    }

    points.forEach((p, i) => {
        const goingUp = i > 0 ? p.price >= points[i - 1].price : true;
        const ptColor = goingUp ? '#00ff7f' : '#ff4466';

        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', p.x);
        circle.setAttribute('cy', p.y);
        circle.setAttribute('r', '3');
        circle.setAttribute('fill', ptColor);
        circle.setAttribute('stroke', '#000');
        circle.setAttribute('stroke-width', '1');
        circle.setAttribute('title', `Tick ${i + 1}: ${p.price.toFixed(decimals)} (${goingUp ? '↑' : '↓'})`);
        g.appendChild(circle);
    });

    const priceMinEl = document.createElementNS(svgNS, 'text');
    priceMinEl.setAttribute('x', w + 8);
    priceMinEl.setAttribute('y', yScale(minPrice) + 4);
    priceMinEl.setAttribute('fill', '#ff4466');
    priceMinEl.setAttribute('font-size', '10');
    priceMinEl.setAttribute('font-weight', 'bold');
    priceMinEl.textContent = minPrice.toFixed(decimals);
    g.appendChild(priceMinEl);

    const priceMaxEl = document.createElementNS(svgNS, 'text');
    priceMaxEl.setAttribute('x', w + 8);
    priceMaxEl.setAttribute('y', yScale(maxPrice) + 4);
    priceMaxEl.setAttribute('fill', '#00ff7f');
    priceMaxEl.setAttribute('font-size', '10');
    priceMaxEl.setAttribute('font-weight', 'bold');
    priceMaxEl.textContent = maxPrice.toFixed(decimals);
    g.appendChild(priceMaxEl);

    svg.appendChild(g);
    container.appendChild(svg);
}

function updateLineLegend() {
    const count = Math.min(priceHistory.length, 50);
    const legend = document.getElementById('chart-legend-line');
    legend.innerHTML = `
        <span><span class="dot" style="background:#00ff7f"></span> Subida (↑)</span>
        <span><span class="dot" style="background:#ff4466"></span> Bajada (↓)</span>
        <span><span class="dot" style="background:rgba(0,255,119,.15)"></span> ${count} precios | ${ticks.length} ticks</span>
    `;
}

let floatTag = null;

function initFloatTag() {
    if (floatTag) return;
    floatTag = document.createElement('div');
    floatTag.className = 'float-tag';
    floatTag.style.cssText = `
        position:fixed;pointer-events:none;z-index:9999;
        background:rgba(10,10,25,.92);border:1px solid #00ff7f;
        color:#fff;padding:6px 10px;border-radius:4px;
        font-size:11px;font-family:monospace;line-height:1.4;
        opacity:0;visibility:hidden;transition:opacity .15s;
        box-shadow:0 0 12px rgba(0,255,119,.35);
        pointer-events:none;
    `;
    document.body.appendChild(floatTag);
}

function showFloatTag(e, digit, count, pct) {
    initFloatTag();
    floatTag.innerHTML = `<div style="color:#00cc66;font-size:10px;margin-bottom:2px;">DÍGITO ${digit}</div>` +
                         `<div>${count} ocurrencias</div>` +
                         `<div style="color:#ffaa00;">${pct}% del total</div>`;
    floatTag.style.opacity = '1';
    floatTag.style.visibility = 'visible';
    moveFloatTag(e);
}

function moveFloatTag(e) {
    if (!floatTag) return;
    const rect = floatTag.getBoundingClientRect();
    let x = e.clientX + 14;
    let y = e.clientY + 14;
    if (x + rect.width > window.innerWidth - 10) x = e.clientX - rect.width - 14;
    if (y + rect.height > window.innerHeight - 10) y = e.clientY - rect.height - 14;
    floatTag.style.left = x + 'px';
    floatTag.style.top = y + 'px';
}

function hideFloatTag() {
    if (floatTag) {
        floatTag.style.opacity = '0';
        floatTag.style.visibility = 'hidden';
    }
}

function updateStats() {
    const total = ticks.length || 1;
    let hot = 0, hotCount = 0;
    let cold = 0, coldCount = Infinity;

    digitCounts.forEach((c, i) => {
        if (c > hotCount) { hotCount = c; hot = i; }
        if (c < coldCount) { coldCount = c; cold = i; }
    });

    const even = ticks.filter(x => x % 2 === 0).length;
    const odd = total - even;
    const thold = parseInt(document.getElementById('trade-thold').value) || 5;
    const overThold = ticks.filter(x => x > thold).length;
    const underThold = total - overThold;

    const hotPct = (hotCount / total * 100).toFixed(1);
    const coldPct = (coldCount / total * 100).toFixed(1);
    const evenPct = (even / total * 100).toFixed(1);
    const oddPct = (odd / total * 100).toFixed(1);
    const overPct = (overThold / total * 100).toFixed(1);
    const underPct = (underThold / total * 100).toFixed(1);

    document.getElementById('stats-grid').innerHTML = `
        <div class="stat-box tooltip"><div class="val">${hot}</div><div class="lbl">HOT (${hotPct}%)</div><span class="tooltip-text">Dígito más frecuente: ${hot} (${hotCount} ocurrencias, ${hotPct}%)</span></div>
        <div class="stat-box tooltip"><div class="val">${cold}</div><div class="lbl">COLD (${coldPct}%)</div><span class="tooltip-text">Dígito menos frecuente: ${cold} (${coldCount} ocurrencias, ${coldPct}%)</span></div>
        <div class="stat-box tooltip"><div class="val">${evenPct}%</div><div class="lbl">EVEN</div><span class="tooltip-text">Dígitos pares (0,2,4,6,8): ${even} de ${total} (${evenPct}%)</span></div>
        <div class="stat-box tooltip"><div class="val">${oddPct}%</div><div class="lbl">ODD</div><span class="tooltip-text">Dígitos impares (1,3,5,7,9): ${odd} de ${total} (${oddPct}%)</span></div>
        <div class="stat-box tooltip"><div class="val">${overPct}%</div><div class="lbl">OVER &gt;${thold}</div><span class="tooltip-text">Dígitos > ${thold}: ${overThold} de ${total} (${overPct}%)</span></div>
        <div class="stat-box tooltip"><div class="val">${underPct}%</div><div class="lbl">UNDER ≤${thold}</div><span class="tooltip-text">Dígitos ≤ ${thold}: ${underThold} de ${total} (${underPct}%)</span></div>
        <div class="stat-box tooltip"><div class="val">${wins}W</div><div class="lbl">GANADAS</div><span class="tooltip-text">Operaciones ganadas: ${wins}</span></div>
        <div class="stat-box tooltip"><div class="val">${losses}L</div><div class="lbl">PERDIDAS</div><span class="tooltip-text">Operaciones perdidas: ${losses}</span></div>
     `;
}

function formatMoney(v) {
    return '$' + v.toFixed(2);
}

function updateAccount() {
    const decimals = symbols[document.getElementById('symbol').value]?.decimals || 2;
    const profitClass = totalProfit >= 0 ? 'green' : 'red';
    const profitSign = totalProfit >= 0 ? '+' : '';
    document.getElementById('acc-balance').textContent = formatMoney(accountBalance);
    document.getElementById('acc-pnl').textContent = profitSign + formatMoney(totalProfit);
    document.getElementById('acc-pnl').className = 'acc-pnl-val ' + profitClass;
    document.getElementById('acc-won').textContent = contractsWon;
    document.getElementById('acc-lost').textContent = contractsLost;
}

function updateTradeStatus() {
    const statusEl = document.getElementById('trade-status');
    if (trade) {
        const digit = trade.digit;
        const type = trade.type;
        const thold = trade.thold;
        const won = type === 'over' ? digit > thold : digit <= thold;
        const resultClass = won ? 'green' : 'red';
        const resultText = won ? 'GANAR' : 'PERDER';
        statusEl.innerHTML = `<span class="${resultClass}">${trade.direction} ${type.toUpperCase()} $${thold}</span> - Dígito: ${digit} - <span class="bold ${resultClass}">${resultText}</span>`;
    } else {
        const type = document.getElementById('trade-type').value;
        const thold = document.getElementById('trade-thold').value;
        statusEl.innerHTML = `<span class="cyan">Listo: ${type.toUpperCase()} $${thold}</span>`;
    }
}

function openTrade() {
    if (!isRunning) return;
    if (trade) {
        showToast('Ya hay una operación abierta', 'error');
        return;
    }
    if (ticks.length < 10) {
        showToast('Necesita más datos de ticks', 'error');
        return;
    }

    const tholdInput = document.getElementById('trade-thold');
    tholdInput.classList.remove('error');

    let thold = parseInt(tholdInput.value);
    const type = document.getElementById('trade-type').value;
    const price = currentPrice;

    let stake = martingala ? lastMartingalaStake : 1;

    trade = {
        type: type,
        thold: thold,
        price: price,
        digit: null,
        stake: stake,
        entryIndex: ticks.length,
        entryTick: ticks.length,
        direction: type === 'over' ? '📈' : '📉',
        timestamp: new Date().toLocaleTimeString()
    };

    log(`<span class="cyan">▶ OPERACIÓN ABIERTA</span>: ${trade.direction} ${type.toUpperCase()} $${thold}`);
    log(`<span class="gray">  Precio: ${price.toFixed(symbols[document.getElementById('symbol').value].decimals)} | Stake: ${trade.stake.toFixed(2)} 💰 | ${trade.timestamp}</span>`);
    if (martingala) {
        log(`<span class="yellow">  Martingala: ACTIVADA (stake base ${lastMartingalaStake.toFixed(2)})</span>`);
    }

    tradeCount++;
    document.getElementById('btn-trade').textContent = 'CERRAR';
    document.getElementById('btn-trade').onclick = closeTrade;
}

function closeTrade() {
    if (!trade) return;
    if (trade.digit === null) {
        showToast('Operación aún no resuelta', 'error');
        return;
    }
    const won = trade.type === 'over' ? trade.digit > trade.thold : trade.digit <= trade.thold;
    resolveTrade(won, trade.digit);
}

function checkTrade(digit) {
    if (trade && trade.digit === null) {
        const ticksSinceEntry = ticks.length - trade.entryTick;
        if (ticksSinceEntry >= 3) {
            trade.digit = digit;
            resolveTrade(trade.type === 'over' ? digit > trade.thold : digit <= trade.thold, digit);
        }
    }
}

function resolveTrade(won, digit) {
    if (won) {
        wins++;
        contractsWon++;
        currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
        const profit = trade.stake * 0.85;
        totalProfit += profit;
        accountBalance += profit;
        const netTotal = wins - losses;

        log(`<span class="green">✓ GANADA</span> | dígito ${digit} | Profit: ${profit.toFixed(2)} 💰 | Net: ${netTotal >= 0 ? '+' : ''}${netTotal}`);

        if (martingala && currentStreak > 0) {
            lastMartingalaStake = 1;
        }
    } else {
        losses++;
        contractsLost++;
        currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
        const loss = trade.stake;
        totalProfit -= loss;
        accountBalance -= loss;

        if (martingala) {
            lastMartingalaStake = trade.stake * 2;
            log(`<span class="red">✗ PERDIDA</span> | dígito ${digit} | Pérdida: ${loss.toFixed(2)} 💰 | <span class="yellow">Martingala → ${lastMartingalaStake.toFixed(2)} 💰</span>`);
        } else {
            log(`<span class="red">✗ PERDIDA</span> | dígito ${digit} | Pérdida: ${loss.toFixed(2)} 💰`);
        }
    }

    trade = null;
    document.getElementById('btn-trade').textContent = 'ENTRAR';
    document.getElementById('btn-trade').onclick = openTrade;
    document.getElementById('trade-status').innerHTML = '<span class="cyan">Listo para operar</span>';
    updateStats();
    updateAccount();


function toggleMartingala() {
    martingala = !martingala;
    const btn = document.getElementById('btn-martingala');
    if (martingala) {
        btn.textContent = 'ACTIVADO';
        btn.classList.add('active');
        btn.style.background = '#00ff7f';
        btn.style.color = '#000';
        log('<span class="green">✧ Martingala ACTIVADA</span>');
    } else {
        btn.textContent = 'DESACTIVADO';
        btn.classList.remove('active');
        btn.style.background = '';
        btn.style.color = '';
        log('<span class="yellow">✧ Martingala DESACTIVADA</span>');
    }
}

function stop() {
    isRunning = false;
    if (ws) {
        ws.close();
        ws = null;
    }
    document.getElementById('btn-start').disabled = false;
    document.getElementById('btn-stop').disabled = true;
    document.getElementById('btn-trade').disabled = true;
    if (trade) {
        trade = null;
        document.getElementById('btn-trade').textContent = 'ENTRAR';
        document.getElementById('btn-trade').onclick = openTrade;
    }
    log('<span class="yellow">Sesión detenida</span>');
}

function log(message, prepend = true) {
    const terminal = document.getElementById('terminal');
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML = message;

    if (prepend) {
        terminal.prepend(line);
    } else {
        terminal.appendChild(line);
    }

    const lines = terminal.querySelectorAll('.terminal-line');
    if (lines.length > 300) {
        lines[lines.length - 1].remove();
    }
}

function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show' + (type === 'error' ? ' error' : '');
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

function updateAnalysis() {
    if (ticks.length < 5) return;

    const total = ticks.length || 1;
    let hot = 0, hotCount = 0;
    let cold = 0, coldCount = Infinity;

    digitCounts.forEach((c, i) => {
        if (c > hotCount) { hotCount = c; hot = i; }
        if (c < coldCount) { coldCount = c; cold = i; }
    });

    const even = ticks.filter(x => x % 2 === 0).length;
    const odd = total - even;
    const thold = parseInt(document.getElementById('trade-thold').value) || 5;
    const overN = ticks.filter(x => x > thold).length;
    const underN = total - overN;

    const maxPct = hotCount / total;
    const overPct = overN / total;
    const underPct = underN / total;
    const evenPct = even / total;
    const oddPct = odd / total;

    log('<span class="cyan">═══════════════════════════════</span>');
    log('<span class="yellow">📊 ANÁLISIS DE MERCADO</span>');
    log('<span class="cyan">═══════════════════════════════</span>');
    log(`<span class="green">Hot digit:</span> ${hot} (${(maxPct*100).toFixed(1)}%) | <span class="gray">Cold: ${cold} (${(coldCount/total*100).toFixed(1)}%)</span>`);

    if (maxPct > 0.20) {
        log(`<span class="green">MATCH:</span> dígito ${hot} (<span class="bold">${(maxPct*100).toFixed(1)}%</span>) - Entrar <span class="yellow">DIFFER</span>`);
    } else {
        log('<span class="cyan">Mercado equilibrado - sin dígito dominante</span>');
    }

    if (overPct > 0.55) {
        log(`<span class="green">OVER ${thold}</span> fuerte (${(overPct*100).toFixed(1)}%) - Considerar <span class="yellow">UNDER</span>`);
    } else if (underPct > 0.55) {
        log(`<span class="green">UNDER ${thold}</span> fuerte (${(underPct*100).toFixed(1)}%) - Considerar <span class="yellow">OVER</span>`);
    } else {
        log(`<span class="gray">Over/Under ${thold} balanceado</span>`);
    }

    if (evenPct > 0.55) {
        log(`<span class="green">EVEN</span> dominante - Considerar <span class="yellow">ODD</span>`);
    } else if (oddPct > 0.55) {
        log(`<span class="green">ODD</span> dominante - Considerar <span class="yellow">EVEN</span>`);
    }

    log('<span class="cyan">═══════════════════════════════</span>');
}

document.getElementById('symbol').addEventListener('change', function() {
    if (isRunning) {
        stop();
        start();
    }
});

document.getElementById('trade-type').addEventListener('change', function() {
    const type = this.value;
    const tholdInput = document.getElementById('trade-thold');
    if (type === 'over') {
        tholdInput.placeholder = '> N';
    } else {
        tholdInput.placeholder = '≤ N';
    }
    updateTradeStatus();
});

document.getElementById('trade-thold').addEventListener('input', function() {
    const thold = parseInt(this.value);
    if (isNaN(thold) || thold < 0 || thold > 9) return;
    updateTradeStatus();
});

document.getElementById('trade-thold').addEventListener('change', function() {
    const thold = parseInt(this.value);
    if (isNaN(thold) || thold < 0 || thold > 9) return;
    updateTradeStatus();
    updateStats();
    if (isRunning) {
        const type = document.getElementById('trade-type').value;
        if (ticks.length >= 5) {
            log('<span class="cyan">Umbral actualizado → ' + type.toUpperCase() + ' $' + thold + ' - Reanalizando...</span>');
            lastAnalysisTick = Math.max(0, ticks.length - 31);
            updateAnalysis();
        } else {
            log('<span class="cyan">Umbral actualizado: ' + type.toUpperCase() + ' $' + thold + '</span>');
        }
    } else {
        log('<span class="cyan">Umbral configurado: $' + thold + '</span>');
    }
});

document.getElementById('acc-balance').addEventListener('dblclick', function() {
    if (balanceEditing) return;
    balanceEditing = true;
    const span = this;
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.01';
    input.min = '0';
    input.value = accountBalance.toFixed(2);
    input.className = 'acc-val editing';
    input.style.cssText = 'background:#000;color:#00ff7f;border:1px solid #00ff7f;border-radius:3px;padding:1px 4px;font-family:monospace;font-size:14px;width:130px;';

    span.replaceWith(input);
    input.focus();
    input.select();

    const finishEdit = () => {
        const val = parseFloat(input.value);
        if (!isNaN(val) && val >= 0) {
            accountBalance = val;
            showToast('Balance actualizado: ' + formatMoney(val));
        }
        input.replaceWith(span);
        balanceEditing = false;
    };

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            finishEdit();
        } else if (e.key === 'Escape') {
            input.value = accountBalance.toFixed(2);
            finishEdit();
        }
    });
    input.addEventListener('blur', finishEdit);
});

updateDigitsChart();
updateStats();
updateAccount();
document.getElementById('btn-stop').disabled = true;
document.getElementById('btn-trade').disabled = true;
