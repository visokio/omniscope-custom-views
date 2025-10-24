self.addEventListener('message', (event) => {
  const { id, text } = event.data || {};
  if (typeof text !== 'string') {
    self.postMessage({ id, success: false, error: 'Invalid payload' });
    return;
  }
  try {
    const parsed = JSON.parse(text);
    self.postMessage({ id, success: true, payload: parsed });
  } catch (err) {
    self.postMessage({ id, success: false, error: err?.message || 'Parse error' });
  }
});
