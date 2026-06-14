const base = 'http://127.0.0.1:3001';
(async () => {
  try {
    const productRes = await fetch(`${base}/api/products?name=${encodeURIComponent('Test Product 1781423137399')}`);
    const prod = await productRes.json();
    console.log('product', JSON.stringify(prod, null, 2));
    if (!prod?.name) {
      console.log('Product not found, aborting');
      return;
    }
    const customersRes = await fetch(`${base}/api/customers`);
    const customers = await customersRes.json();
    const customer = Array.isArray(customers) ? customers[0] : customers.data?.[0];
    if (!customer?.id) {
      console.log('No customer found');
      return;
    }
    const payload = {
      orderDate: '2026-06-14',
      purchaseDate: '2026-06-14',
      shipCost: 5000,
      notes: 'Order created by test',
      relatedImage: '',
      customerId: customer.id,
      discount: 10,
      productItems: [ { productName: prod.name, quantity: 1 } ]
    };
    const orderRes = await fetch(`${base}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const orderJson = await orderRes.json();
    console.log('order status', orderRes.status);
    console.log('order body', JSON.stringify(orderJson, null, 2));
  } catch (e) {
    console.error('ERROR', e);
  }
})();
