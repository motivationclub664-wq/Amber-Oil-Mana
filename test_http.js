const base = 'http://127.0.0.1:3001';
(async () => {
  try {
    const res = await fetch(`${base}/api/customers`);
    console.log('status', res.status);
    console.log('headers', Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log('body', text.slice(0, 200));
  } catch (e) {
    console.error('ERROR', e);
  }
})();
