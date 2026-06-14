import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const month = Number(url.searchParams.get('month')) || new Date().getMonth() + 1;
  const year = Number(url.searchParams.get('year')) || new Date().getFullYear();

  const netProfitResult = await query(
    'SELECT COALESCE(SUM(net_profit), 0) AS total_net_profit FROM orders WHERE EXTRACT(MONTH FROM order_date) = $1 AND EXTRACT(YEAR FROM order_date) = $2',
    [month, year]
  );

  const newCustomersResult = await query(
    `SELECT COUNT(DISTINCT c.id) AS new_customers
     FROM customers c
     JOIN orders o ON c.id = o.customer_id
     WHERE EXTRACT(MONTH FROM o.order_date) = $1 AND EXTRACT(YEAR FROM o.order_date) = $2
       AND NOT EXISTS (
         SELECT 1 FROM orders o2 WHERE o2.customer_id = c.id
           AND (EXTRACT(YEAR FROM o2.order_date) < $2 OR (EXTRACT(YEAR FROM o2.order_date) = $2 AND EXTRACT(MONTH FROM o2.order_date) < $1))
       )`,
    [month, year]
  );

  const returningCustomersResult = await query(
    `SELECT COUNT(DISTINCT c.id) AS returning_customers
     FROM customers c
     JOIN orders o ON c.id = o.customer_id
     WHERE EXTRACT(MONTH FROM o.order_date) = $1 AND EXTRACT(YEAR FROM o.order_date) = $2
       AND EXISTS (
         SELECT 1 FROM orders o2 WHERE o2.customer_id = c.id
           AND (EXTRACT(YEAR FROM o2.order_date) < $2 OR (EXTRACT(YEAR FROM o2.order_date) = $2 AND EXTRACT(MONTH FROM o2.order_date) < $1))
       )`,
    [month, year]
  );

  const totalOrdersResult = await query(
    'SELECT COUNT(*) AS total_orders FROM orders WHERE EXTRACT(MONTH FROM order_date) = $1 AND EXTRACT(YEAR FROM order_date) = $2',
    [month, year]
  );

  const lowStockResult = await query('SELECT name, quantity FROM products WHERE quantity < 10 ORDER BY quantity ASC LIMIT 10');

  const topProductsResult = await query(
     `SELECT p.name, COALESCE(SUM(op.quantity),0) AS order_count
      FROM order_products op
      JOIN products p ON op.product_name = p.name
      GROUP BY p.name
      ORDER BY order_count DESC
      LIMIT 5`
  );

  const recentOrdersResult = await query(
    'SELECT o.id, o.order_date, o.net_profit, c.name AS customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id ORDER BY o.order_date DESC LIMIT 5'
  );

  const revenueHistoryResult = await query(
    `SELECT to_char(order_date, 'DD/MM') AS date, COALESCE(SUM(net_profit), 0) AS value
     FROM orders
     WHERE order_date >= current_date - interval '6 days'
     GROUP BY date
     ORDER BY min(order_date)`
  );

  const revenueHistory = revenueHistoryResult.rows.map((row) => ({
    date: row.date,
    value: Number(row.value ?? 0),
  }));

  return NextResponse.json({
    totalNetProfit: parseFloat(netProfitResult.rows[0].total_net_profit ?? 0),
    newCustomers: Number(newCustomersResult.rows[0]?.new_customers ?? 0),
    returningCustomers: Number(returningCustomersResult.rows[0]?.returning_customers ?? 0),
    totalOrders: Number(totalOrdersResult.rows[0]?.total_orders ?? 0),
    lowStockProducts: lowStockResult.rows,
    topProducts: topProductsResult.rows,
    recentOrders: recentOrdersResult.rows,
    revenueHistory,
  });
}
