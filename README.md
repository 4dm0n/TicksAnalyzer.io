# Moya Analyzer

The glassmorphic interface uses `glass.css` alongside `index.html`. Keep both files in the same folder; no build step or framework is required. The existing Matrix, Dark, Purple, Ocean and White themes support phone, tablet and desktop layouts.

A real-time tick analysis dashboard for Deriv synthetic indices and forex pairs. Built as a single HTML file with vanilla JavaScript, featuring WebSocket connectivity to Deriv's public API, interactive charts, and simulated trading capabilities.

## Features

### Real-time Data Analysis
- **Live WebSocket connection** to Deriv's public trading API (no OAuth/API key required)
- **Multi-asset support**: Volatility 10/25/50/75/100 indices + BTC/USD
- **Sliding window analysis** of the last 200 ticks
- **Digit frequency tracking** with hot/cold identification

### Interactive Visualizations
- **Bar Chart** - Digit distribution with hot/cold highlighting
- **Donut Chart** - Percentage-based distribution with hover tooltips
- **Line Chart** - Price movement history (last 50 ticks) with trend coloring
- **Statistics Grid** - Hot/Cold digits, Even/Odd ratios, Over/Under thresholds

### Simulated Trading
- **Over/Under contracts** on last digit predictions
- **Configurable threshold** (0-9) for trade entry
- **Martingale strategy** toggle with automatic stake doubling
- **Account simulation** with balance, PnL, win/loss tracking
- **3-tick resolution delay** for realistic contract settlement

### Market Analysis Engine
- **Automated pattern detection** every 30 ticks
- **Hot digit alerts** (>20% frequency triggers "MATCH" signal)
- **Over/Under bias detection** (>55% triggers counter-trade suggestion)
- **Even/Odd dominance alerts** with contrarian recommendations
- **Terminal logging** with color-coded messages (green/red/cyan/yellow/gray)

## Quick Start

1. Clone or download the repository
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari)
3. Select an asset from the dropdown
4. Click **Iniciar** to begin live analysis
5. Configure trade parameters and click **ENTRAR** for simulated trades

## Supported Assets

| Symbol | Name | Decimals |
|--------|------|----------|
| R_10 | Volatility 10 Index | 2 |
| R_25 | Volatility 25 Index | 2 |
| R_50 | Volatility 50 Index | 2 |
| R_75 | Volatility 75 Index | 2 |
| R_100 | Volatility 100 Index | 2 |
| BTCUSD | Bitcoin / USD | 2 |

## Trading Parameters

- **Type**: Over (digit > threshold) / Under (digit ≤ threshold)
- **Threshold**: Integer 0-9
- **Martingale**: Doubles stake after loss, resets after win
- **Stake**: Base $1 (configurable via Martingale)
- **Payout**: 85% on win, 100% loss on loss

## Technical Details

### Architecture
- Single-file application (`index.html`)
- Vanilla ES6 JavaScript (no build step required)
- CSS Grid/Flexbox for responsive layout
- SVG-based charts (no external libraries)
- WebSocket API for real-time data

### Data Flow
```
WebSocket (wss://api.derivws.com) → tick events → digit extraction → 
sliding window (200) → chart updates + stats + trade resolution + analysis
```

### Key Functions
- `start()` / `stop()` - Session lifecycle
- `processTick()` - Core data pipeline
- `updateDisplay()` - Chart + stats + trade status refresh
- `updateAnalysis()` - Automated pattern detection (every 30 ticks)
- `openTrade()` / `closeTrade()` / `resolveTrade()` - Trading logic
- `toggleMartingala()` - Strategy toggle

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Edge 80+
- Safari 14+
- Requires WebSocket and ES6 support

## Security Notes

- Connects to Deriv's **public WebSocket endpoint** (no authentication)
- No API keys, secrets, or credentials stored
- All trading is **simulated** - no real money involved
- Runs entirely client-side

## Disclaimer

This tool is for **educational and analysis purposes only**. Simulated results do not guarantee future performance. Deriv synthetic indices are random by design - past digit patterns do not predict future outcomes. Never trade with money you cannot afford to lose.

## License

MIT License - Feel free to use, modify, and distribute.
