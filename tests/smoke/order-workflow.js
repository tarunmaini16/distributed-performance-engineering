
import { check } from 'k6';
import { apiClient } from '../../utils/http-client.js';
import { getConfig } from '../../config/environment.js';

const config = getConfig();

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate==1'],
    http_req_failed: [
      `rate<${config.thresholds.maxFailureRate}`,
    ],
    http_req_duration: [
      `p(95)<${config.thresholds.p95ResponseTime}`,
    ],
  },
};

export default function () {
  // 1. Create an order
  const created = apiClient.post('/api/orders', {
    product: 'Laptop',
    quantity: 2,
  });

  const createPassed = check(created, {
    'POST returns 201': (r) => r.status === 201,
    'order ID generated': (r) =>
      typeof r.json('id') === 'string',
    'initial status is CREATED': (r) =>
      r.json('status') === 'CREATED',
  });

  if (!createPassed) {
    return;
  }

  const orderId = created.json('id');
  const endpoint = `/api/orders/${orderId}`;

  // 2. Retrieve the order
  const retrieved = apiClient.get(endpoint);

  check(retrieved, {
    'GET returns 200': (r) => r.status === 200,
    'GET returns correct product': (r) =>
      r.json('product') === 'Laptop',
    'GET returns correct quantity': (r) =>
      r.json('quantity') === 2,
  });

  // 3. Update the order
  const updated = apiClient.put(endpoint, {
    product: 'Monitor',
    quantity: 3,
  });

  check(updated, {
    'PUT returns 200': (r) => r.status === 200,
    'PUT updates product': (r) =>
      r.json('product') === 'Monitor',
    'PUT updates quantity': (r) =>
      r.json('quantity') === 3,
  });

  // 4. Transition to PROCESSING
  const processing = apiClient.patch(endpoint, {
    status: 'PROCESSING',
  });

  const processingPassed = check(processing, {
    'PATCH returns 200': (r) => r.status === 200,
    'status changes to PROCESSING': (r) =>
      r.json('status') === 'PROCESSING',
  });

  if (!processingPassed) {
    return;
  }

  // 5. Transition to COMPLETED
  const completed = apiClient.patch(endpoint, {
    status: 'COMPLETED',
  });

  check(completed, {
    'order reaches COMPLETED': (r) =>
      r.status === 200 &&
      r.json('status') === 'COMPLETED',
  });

  // 6. Delete the order
  const deleted = apiClient.delete(endpoint);

  check(deleted, {
    'DELETE returns 204': (r) => r.status === 204,
  });
}
