
import { check } from 'k6';
import { apiClient } from '../../utils/http-client.js';
import { buildOrder } from '../../data/order-data.js';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate==1'],
  },
};

export default function () {
  const created = apiClient.post(
    '/api/orders',
    buildOrder()
  );

  const createdSuccessfully = check(created, {
    'order created successfully': (r) =>
      r.status === 201 &&
      typeof r.json('id') === 'string',
  });

  if (!createdSuccessfully) {
    return;
  }

  const endpoint = `/api/orders/${created.json('id')}`;

  try {
    // Cannot skip directly from CREATED to COMPLETED.
    const skipped = apiClient.patch(endpoint, {
      status: 'COMPLETED',
    });

    check(skipped, {
      'skipping PROCESSING returns 409': (r) =>
        r.status === 409,
    });

    // Valid transition.
    const processing = apiClient.patch(endpoint, {
      status: 'PROCESSING',
    });

    const processingSucceeded = check(processing, {
      'CREATED to PROCESSING succeeds': (r) =>
        r.status === 200 &&
        r.json('status') === 'PROCESSING',
    });

    if (!processingSucceeded) {
      return;
    }

    // Cannot transition backwards.
    const reversed = apiClient.patch(endpoint, {
      status: 'CREATED',
    });

    check(reversed, {
      'reverse transition returns 409': (r) =>
        r.status === 409,
    });

    // Complete the order.
    const completed = apiClient.patch(endpoint, {
      status: 'COMPLETED',
    });

    check(completed, {
      'PROCESSING to COMPLETED succeeds': (r) =>
        r.status === 200 &&
        r.json('status') === 'COMPLETED',
    });
  } finally {
    const deleted = apiClient.delete(endpoint);

    check(deleted, {
      'test order cleaned up': (r) =>
        r.status === 204,
    });
  }
}
