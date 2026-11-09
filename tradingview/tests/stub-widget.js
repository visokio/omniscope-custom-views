// Test stand-in for TradingView's embed-widget-advanced-chart.js: reads the JSON settings from its own script text,
// as the real widget does, draws a placeholder in the widget container and records the settings in window.__tv.
(function () {
  var me = document.currentScript, config = JSON.parse(me.text);
  (window.__tv = window.__tv || []).push(config);
  var box = me.parentNode.querySelector('.tradingview-widget-container__widget');
  var d = document.createElement('div');
  d.className = 'stub-chart';
  d.setAttribute('data-symbol', config.symbol);
  d.style.cssText = 'width:100%;height:100%;box-sizing:border-box;border:1px solid #e0e3eb;display:flex;align-items:center;' +
    'justify-content:center;font:14px sans-serif;' + (config.theme === 'dark' ? 'background:#131722;color:#d1d4dc' : 'background:#fff;color:#131722');
  d.textContent = config.symbol + ', ' + config.interval + ' bars (test stand-in for the TradingView chart)';
  box.appendChild(d);
})();
