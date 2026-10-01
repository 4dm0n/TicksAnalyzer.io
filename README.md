# Moya Analyzer

The glassmorphic interface uses `glass.css` alongside `index.html`. Styles and workspace code are embedded in index.html, so only that HTML is needed for deployment. No framework is required. The existing Matrix, Dark, Purple, Ocean and White themes support phone, tablet and desktop layouts.

A real-time tick analysis dashboard for Deriv synthetic indices and forex pairs. Built with HTML, CSS and vanilla JavaScript, featuring WebSocket connectivity to Deriv's public API, interactive charts, and simulated trading capabilities.

## Features

### Real-time Data Analysis
- **Live WebSocket connection** to Deriv's public trading API (no OAuth/API key required)
- **Multi-asset support**: Volatility 10/25/50/75/100 indices + BTC/USD
- **Sliding window analysis** of the last 200 ticks
- **Digit frequency tracking** with hot/cold identification

### Interactive Visualizations
- **Bar Chart** - Digit distribution with hot/cold highlighting
- **Donut Chart** - Percentage-based distribution with hover tooltips
- **Line Chart** - Last-digit sequence (last 50 ticks)
- **Statistics Grid** - Hot/Cold digits, Even/Odd ratios, Over/Under thresholds

### Simulated Trading
- **Over/Under contracts** on last digit predictions
- **Configurable threshold** (0-9) for trade entry
- **Martingale strategy** toggle with automatic stake doubling
- **Account simulation** with balance, PnL, win/loss tracking
- **3-tick resolution delay** in this simulator

### Signals and workspace
- A configurable 20–1000-tick window updates on every tick; the independent tick counter keeps advancing after 200.
- Confidence is the observed frequency of the analyzed direction at the selected threshold, not a predictive win probability.
- Arrows use the selected sensitivity: Frequent (at least 3 percentage points above baseline), Balanced (lower Wilson 80% bound above baseline), or Strict (Wilson 95%). Otherwise the UI reports no clear signal. Repeated overlapping windows may produce chance signals.
- The bot waits for the configured window and follows the main signal, including its threshold and sensitivity.
- Immediate history: open blue, won green, lost red, cancelled grey in every theme.
- Reorder sections with transparent dot handles (mouse or touch; keyboard arrows when focused); localStorage saves their order. Fields include modal help and local SVG icons.
- Account and history are in-memory; only theme and section order persist across reloads.

## Quick Start

1. Clone or download the repository
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari)
3. Select an asset from the dropdown
4. Click **Iniciar** to begin live analysis
5. Configure trade parameters and click **Abrir operación** for simulated trades

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
- **Payout**: theoretical gross multiplier 10 / winning digits. Net profit is stake × (multiplier − 1), rounded to cents. Not a live Deriv quote.

## Technical Details

### Architecture
- HTML application (`index.html`), stylesheet (`glass.css`) and workspace helpers (`workspace.js`)
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

- Current Chrome, Firefox, Edge and Safari releases with dialog support.
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

## Balance, connection and deployment

Opening reserves the stake. Wins return the stake plus net profit; losses never debit it twice. Stopping or disconnecting cancels the pending trade and refunds the stake. Reconnecting preserves PnL, counts and history. Take profit stops both the session and bot.

Deploy **index.html** to GitHub Pages. Styles, SVG icons and workspace logic are embedded, so missing or stale companion assets cannot change the UI. The app uses the [Deriv public WebSocket](https://developers.deriv.com/docs/options/ws-public/), displays actionable connection errors and retries up to three times. Tick precision follows provider pip_size; the decimals table above lists initial fallback values only.

## Verification

35 functional checks, persisted ordering, 30 theme/viewport combinations and a real read-only Deriv tick connection passed in desktop Chrome. See workspace-checks.json. Physical iOS/Android validation remains pending. Run Get-Content verify-workspace.cjs -Raw | node on Windows with Chrome; CHROME_PATH can override the executable. Tests use ports 8765/9223 and the isolated .ui-browser profile.

### Updating embedded assets

`glass.css` and `workspace.js` remain editable sources. After changing them, run `node sync-assets.cjs` to synchronize their embedded blocks in `index.html`. The resulting HTML works on its own. Hard-refresh after publishing to bypass an older cached HTML document.

### Configurable window and sensitivity

Defaults: 100 ticks, Frequent sensitivity, all thresholds (0–8). Preferences persist in localStorage. Frequent mode is exploratory and does not require statistical significance or promise profitability. The main signal ranks by standardized deviation; Confidence refers to it. Multiple threshold arrows can be correlated. Shrinking the window discards oldest data; growing it waits for new samples without resetting account or settlement counters.
