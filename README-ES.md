# Moya Analyzer

Un panel de análisis de ticks en tiempo real para índices sintéticos y pares de divisas de Deriv. Construido con HTML, CSS y JavaScript vanilla, con conectividad WebSocket a la API pública de Deriv, gráficos interactivos y capacidades de trading simulado.

## Características

### Análisis de Datos en Tiempo Real
- **Conexión WebSocket en vivo** a la API pública de trading de Deriv (sin OAuth ni API key requerida)
- **Soporte multi-activo**: Índices Volatility 10/25/50/75/100 + BTC/USD
- **Análisis de ventana deslizante** de los últimos 200 ticks
- **Seguimiento de frecuencia de dígitos** con identificación de calientes/fríos

### Visualizaciones Interactivas
- **Gráfico de Barras** - Distribución de dígitos con resaltado de calientes/fríos
- **Gráfico Donut** - Distribución porcentual con tooltips al pasar ratón
- **Gráfico de Línea** - Secuencia de últimos dígitos (últimos 50 ticks)
- **Cuadrícula de Estadísticas** - Dígitos Hot/Cold, ratios Par/Impar, umbrales Over/Under

### Trading Simulado
- **Contratos Over/Under** sobre predicciones del último dígito
- **Umbral configurable** (0-9) para entrada de operaciones
- **Estrategia Martingala** con alternancia y duplicación automática de apuesta
- **Simulación de cuenta** con balance, PnL, seguimiento de ganadas/perdidas
- **Retraso de resolución de 3 ticks** para liquidación en este simulador

### Señales y workspace
- La ventana conserva entre 20 y 1000 ticks (configurable) y se recalcula con cada tick. El contador total sigue avanzando sin límite de ventana.
- Confidence muestra la frecuencia observada de la dirección analizada para el umbral seleccionado. No es una probabilidad predictiva de ganar.
- Las flechas ↑ OVER / ↓ UNDER aparecen según la sensibilidad elegida: Frecuente (desviación ≥3 puntos porcentuales), Equilibrada (límite Wilson 80%) o Estricta (límite Wilson 95%). Los límites se comparan con la base teórica de cada umbral. Sin esa evidencia se muestra “Sin señal clara”. Las ventanas solapadas pueden generar señales por azar.
- El bot espera a completar la ventana configurada y usa la señal principal visible, con su umbral y sensibilidad.
- Historial inmediato: abierta azul, ganada verde, perdida roja; anulada gris. Los colores semánticos se conservan en todos los temas.
- Secciones reordenables con el control de puntitos (ratón o toque; flechas del teclado al enfocarlo), con orden guardado en localStorage. Cada campo dispone de ayuda modal con ejemplos e iconos SVG locales.
- Historial y balance duran durante la pestaña; no se guardan al recargar. Tema y orden sí persisten cuando el navegador permite almacenamiento.

## Inicio Rápido

1. Clona o descarga el repositorio
2. Abre `index.html` en un navegador moderno (Chrome, Firefox, Edge, Safari). Los estilos, scripts e iconos ya están integrados: basta con este archivo.
3. Selecciona un activo del desplegable
4. Haz clic en **Iniciar** para comenzar el análisis en vivo
5. Configura parámetros de trade y haz clic en **Abrir operación** para operaciones simuladas

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
- **Payout**: multiplicador bruto teórico 10 / dígitos ganadores. Beneficio neto = apuesta × (multiplicador − 1), redondeado a centavos. No es una cotización real de Deriv.

## Detalles Técnicos

### Arquitectura
- Aplicación HTML con JavaScript integrado (`index.html`) con `workspace.js` y capa visual en `glass.css`, sin compilación.
- JavaScript ES6 vanilla (sin paso de build requerido)
- CSS Grid/Flexbox para layout responsivo
- Gráficos basados en SVG (sin librerías externas)
- API WebSocket para datos en tiempo real

### Interfaz glassmorphic
- Cinco temas: Matrix, Dark, Purple, Ocean y White, con preferencia guardada localmente.
- Paneles translúcidos, tipografía del sistema, controles táctiles y áreas seguras para pantallas con notch.
- Distribución adaptable a móviles, tablets y escritorio; el historial conserva desplazamiento horizontal independiente.
- Respeta movimiento reducido y usa fondos sólidos si el navegador no admite desenfoque.
- Verificación en Chrome headless: 30 combinaciones de temas y anchos (320, 390, 768, 1024, 1440 y 1920 px), sin desbordamiento de página ni excepciones de JavaScript. Gráficos comprobados con datos sintéticos. Resultados actualizados en `workspace-checks.json`.
- Pendiente la validación física en Safari/iOS y Android; la recepción real de ticks de Deriv se comprobó en Chrome de escritorio.

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

- Versiones actuales de Chrome, Firefox, Edge y Safari (con soporte de dialog).
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

## Cuenta, conexión y publicación

La apuesta se reserva al abrir; al ganar se devuelve junto con el beneficio. La pérdida no vuelve a descontar la apuesta. Detener o perder la conexión anula la operación pendiente y devuelve la reserva. Reconectar no borra PnL, contadores ni historial. Take profit detiene la sesión y el bot. Se rechazan saldo insuficiente, entradas no finitas y resultados seguros/imposibles.

Sube **index.html** a GitHub Pages. Incluye estilos, iconos SVG y lógica del workspace; no depende de cargar glass.css ni workspace.js por separado. El navegador necesita acceso a [WebSocket público de Deriv](https://developers.deriv.com/docs/options/ws-public/). Los errores ya no muestran undefined: incluyen un mensaje útil, código de cierre y hasta tres reintentos. La precisión de cada tick usa pip_size del proveedor; la tabla anterior solo refleja valores iniciales de respaldo.

## Verificación

44 comprobaciones funcionales, restauración del orden y 30 combinaciones responsive (320–1920 px, cinco temas). Incluyen liquidación después del tick 200, saldo, cancelaciones, Martingala, bot, take profit, modales y geometría del donut. Datos deterministas para lógica y una conexión real de lectura a Deriv. Resultado: workspace-checks.json.

En Windows con Chrome instalado: Get-Content verify-workspace.cjs -Raw | node. CHROME_PATH permite indicar otro ejecutable compatible. Las pruebas usan los puertos locales 8765 y 9223 y un perfil aislado .ui-browser.

### Actualización de estilos e iconos

`glass.css` y `workspace.js` se conservan como fuentes editables. Después de modificarlos, ejecuta `node sync-assets.cjs` para actualizar sus bloques integrados en `index.html`. El HTML generado funciona por sí solo. Al publicar una actualización, recarga con Ctrl+F5 para evitar una copia anterior del propio HTML.

### Ventana y sensibilidad configurables

Valores iniciales: 100 ticks, sensibilidad Frecuente y todos los umbrales (0–8). Las preferencias se guardan en localStorage. El modo frecuente es exploratorio: no exige significancia estadística y no promete rentabilidad. La señal principal se ordena por desviación estandarizada; Confidence corresponde a esa señal. Analizar varios umbrales puede mostrar flechas correlacionadas, no oportunidades independientes. Reducir la ventana descarta datos antiguos; aumentarla espera nuevos datos sin reiniciar la cuenta ni el contador de liquidación.

### Dirección y alcance de señales

Over/Under siempre respeta el selector Predicción, tanto en señales como en operaciones manuales y bot. Solo el elegido muestra y analiza exclusivamente el Umbral seleccionado. Todos analiza 0–8 en la dirección elegida; el bot puede usar el umbral de la señal principal, pero no modifica los selectores. Una entrada manual siempre usa el umbral seleccionado. Los cambios de controles no alteran una operación ya abierta.
