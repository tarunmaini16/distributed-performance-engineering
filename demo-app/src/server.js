
const express = require('express');
const { randomUUID } = require('crypto');

const app = express();
app.use(express.json());

const orders = new Map();

function isValidQuantity(value) {
  return Number.isInteger(value) && value > 0;
}

function isValidProduct(value) {
  return typeof value === 'string' &&
    value.trim().length > 0;
}

app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});

app.post('/api/orders', (req, res) => {
  const { product, quantity } = req.body || {};

  if (!isValidProduct(product) ||
      !isValidQuantity(quantity)) {
    return res.status(400).json({
      error: 'Valid product and positive integer quantity required',
    });
  }

  const order = {
    id: randomUUID(),
    product: product.trim(),
    quantity,
    status: 'CREATED',
  };

  orders.set(order.id, order);
  return res.status(201).json(order);
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.get(req.params.id);

  if (!order) {
    return res.status(404).json({
      error: 'Order not found',
    });
  }

  return res.json(order);
});

app.put('/api/orders/:id', (req, res) => {
  const order = orders.get(req.params.id);

  if (!order) {
    return res.status(404).json({
      error: 'Order not found',
    });
  }

  const { product, quantity } = req.body || {};

  if (!isValidProduct(product) ||
      !isValidQuantity(quantity)) {
    return res.status(400).json({
      error: 'Valid product and positive integer quantity required',
    });
  }

  const updated = {
    ...order,
    product: product.trim(),
    quantity,
  };

  orders.set(order.id, updated);
  return res.json(updated);
});

app.patch('/api/orders/:id', (req, res) => {
  const order = orders.get(req.params.id);

  if (!order) {
    return res.status(404).json({
      error: 'Order not found',
    });
  }

  const { status } = req.body || {};

  if (!['CREATED', 'PROCESSING', 'COMPLETED'].includes(status)) {
    return res.status(400).json({
      error: 'Invalid order status',
    });
  }

  const allowedTransitions = {
    CREATED: ['PROCESSING'],
    PROCESSING: ['COMPLETED'],
    COMPLETED: [],
  };

  if (!allowedTransitions[order.status].includes(status)) {
    return res.status(409).json({
      error: 'Invalid status transition',
    });
  }

  const updated = { ...order, status };
  orders.set(order.id, updated);

  return res.json(updated);
});

app.delete('/api/orders/:id', (req, res) => {
  if (!orders.has(req.params.id)) {
    return res.status(404).json({
      error: 'Order not found',
    });
  }

  orders.delete(req.params.id);
  return res.status(204).send();
});

const port = Number(process.env.PORT || 3000);

app.listen(port, '0.0.0.0', () => {
  console.log(`Order API listening on port ${port}`);
});
