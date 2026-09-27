# Deriv Live Analyzer

Un panel de análisis de ticks en tiempo real para índices sintéticos y pares de divisas de Deriv. Construido como un único archivo HTML con JavaScript vanilla, con conectividad WebSocket a la API pública de Deriv, gráficos interactivos y capacidades de trading simulado.

## Características

### Análisis de Datos en Tiempo Real
- **Conexión WebSocket en vivo** a la API pública de trading de Deriv (sin OAuth ni API key requerida)
- **Soporte multi-activo**: Índices Volatility 10/25/50/75/100 + BTC/USD
- **Análisis de ventana deslizante** de los últimos 200 ticks
- **Seguimiento de frecuencia de dígitos** con identificación de calientes/fríos

### Visualizaciones Interactivas
- **Gráfico de Barras** - Distribución de dígitos con resaltado de calientes/fríos
- **Gráfico Donut** - Distribución porcentual con tooltips al pasar ratón
- **Gráfico de Línea** - Historial de movimiento de precios (últimos 50 ticks) con coloreado de tendencias
- **Cuadrícula de Estadísticas** - Dígitos Hot/Cold, ratios Par/Impar, umbrales Over/Under

### Trading Simulado
- **Contratos Over/Under** sobre predicciones del último dígito
- **Umbral configurable** (0-9) para entrada de operaciones
- **Estrategia Martingala** con alternancia y duplicación automática de apuesta
- **Simulación de cuenta** con balance, PnL, seguimiento de ganadas/perdidas
- **Retraso de resolución de 3 ticks** para liquidación realista de contratos

### Motor de Análisis de Mercado
- **Detección automática de patrones** cada 30 ticks
- **Alertas de dígito caliente** (>20% frecuencia dispara señal "MATCH")
- **Detección de sesgo Over/Under** (>55% dispara sugerencia de contra-operación)
- **Alertas de dominancia Par/Impar** con recomendaciones contrarianas
- **Terminal de logs** con mensajes codificados por color (verde/rojo/cian/amarillo/gris)

## Inicio Rápido

1. Clona o descarga el repositorio
2. Abre `index.html` en un navegador moderno (Chrome, Firefox, Edge, Safari)
3. Selecciona un activo del desplegable
4. Haz clic en **Iniciar** para comenzar el análisis en vivo
5. Configura parámetros de trade y haz clic en **ENTRAR** para operaciones simuladas

## Activos Soportados

| Símbolo | Nombre | Decimales |
|---------|--------|-----------|
| R_10 | Volatility 10 Index | 2 |
| R_25 | Volatility 25 Index | 2 |
| R_50 | Volatility 50 Index | 2 |
| R_75 | Volatility 75 Index | 2 |
| R_100 | Volatility 100 Index | 2 |
| BTCUSD | Bitcoin / USD | 2 |

## Parámetros de Trading

- **Tipo**: Over (dígito > umbral) / Under (dígito ≤ umbral)
- **Umbral**: Entero 0-9
- **Martingala**: Duplica apuesta tras pérdida, resetea tras ganancia
- **Apuesta base**: $1 (configurable vía Martingala)
- **Payout**: 85% en ganancia, 100% pérdida en pérdida

## Detalles Técnicos

### Arquitectura
- Aplicación de archivo único (`index.html`)
- JavaScript ES6 vanilla (sin paso de build requerido)
- CSS Grid/Flexbox para layout responsivo
- Gráficos basados en SVG (sin librerías externas)
- API WebSocket para datos en tiempo real

### Flujo de Datos
```
WebSocket (wss://api.derivws.com) → eventos tick → extracción dígito → 
ventana deslizante (200) → actualización gráficos + stats + resolución trade + análisis
```

### Funciones Principales
- `start()` / `stop()` - Ciclo de vida de sesión
- `processTick()` - Pipeline principal de datos
- `updateDisplay()` - Refresco de gráficos + stats + estado trade
- `updateAnalysis()` - Detección automática de patrones (cada 30 ticks)
- `openTrade()` / `closeTrade()` / `resolveTrade()` - Lógica de trading
- `toggleMartingala()` - Alternancia de estrategia

## Compatibilidad de Navegadores

- Chrome 80+
- Firefox 75+
- Edge 80+
- Safari 14+
- Requiere soporte WebSocket y ES6

## Notas de Seguridad

- Conecta al **endpoint WebSocket público** de Deriv (sin autenticación)
- Sin API keys, secretos o credenciales almacenados
- Todo el trading es **simulado** - no hay dinero real involucrado
- Se ejecuta completamente en el lado del cliente

## Descargo de Responsabilidad

Esta herramienta es solo para **fines educativos y de análisis**. Los resultados simulados no garantizan rendimiento futuro. Los índices sintéticos de Deriv son aleatorios por diseño - los patrones de dígitos pasados no predicen resultados futuros. Nunca operes con dinero que no puedas permitirte perder.

## Licencia

Licencia MIT - Libre para usar, modificar y distribuir.