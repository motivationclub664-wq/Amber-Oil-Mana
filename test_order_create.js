// Test creating an order via POST /api/orders

async function testCreateOrder() {
  const body = {
    orderDate: '2024-01-15',
    purchaseDate: '2024-01-14',
    shipCost: 50000,
    surcharge: 10000,
    discount: 5,
    customerId: '1', // Assuming customer ID 1 exists
    notes: 'Test order',
    relatedImage: '', // Empty image
    productItems: [
      { productName: 'Product 1', quantity: 2 }
    ]
  };

  try {
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testCreateOrder();
