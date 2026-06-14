const base = 'http://127.0.0.1:3001';
(async () => {
  const log = (label, data) => console.log(label, JSON.stringify(data, null, 2));
  try {
    const custRes = await fetch(`${base}/api/customers`);
    const custJson = await custRes.json();
    const customers = Array.isArray(custJson) ? custJson : custJson.data;
    log('customers', customers?.slice(0, 5));
    if (!customers?.[0]?.id) {
      console.log('No customer found');
      return;
    }
    const customerId = customers[0].id;
    const productPayload = {
      name: `Test Product ${Date.now()}`,
      classicalName: 'Test product class',
      netPrice: 10000,
      salePrice: 15000,
      quantity: 10,
      notes: 'Product created by test',
      relatedImage: ''
    };
    const prodRes = await fetch(`${base}/api/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productPayload) });
    const prodJson = await prodRes.json();
    log('create product status', { status: prodRes.status, body: prodJson });
  } catch (e) {
    console.error('ERROR', e);
  }
})();
