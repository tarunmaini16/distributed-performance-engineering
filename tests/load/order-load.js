
import { check, group } from 'k6';
import { apiClient } from '../../utils/http-client.js';
import { getConfig } from '../../config/environment.js';
import { buildOrder } from '../../data/order-data.js';

const config = getConfig();

export const options = {
  scenarios: {
    order_lifecycle: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1m',
      preAllocatedVUs: 10,
      maxVUs: 30,
      stages: [
        { duration: '1m', target: 30 },
        { duration: '1m', target: 60 },
        { duration: '1m', target: 60 },
      ],
      gracefulStop: '30s',
    },
  },
  thresholds: {
    checks: ['rate==1'],
    http_req_failed: ['rate<0.01'],
    http_req_duration: [
      `p(95)<${config.thresholds.p95ResponseTime}`,
    ],
    dropped_iterations: ['count==0'],
  },
};

export default function () {
  let endpoint;

  group('Order lifecycle', () => {
    try {
      const created = apiClient.post(
        '/api/orders',
        buildOrder(),
        { tags: { operation: 'create_order' } }
      );

      const createdOk = check(created, {
        'create order succeeds': (r) =>
          r.status === 201 &&
          typeof r.json('id') === 'string',
      });

      if (!createdOk) return;

      endpoint = `/api/orders/${created.json('id')}`;

      const retrieved = apiClient.get(endpoint, {
        tags: { operation: 'get_order' },
      });

      if (!check(retrieved, {
        'get order succeeds': (r) =>
          r.status === 200 &&
          r.json('quantity') === 2,
      })) return;

      const updated = apiClient.put(
        endpoint,
        buildOrder({ quantity: 3 }),
        { tags: { operation: 'update_order' } }
      );

      if (!check(updated, {
        'update order succeeds': (r) =>
          r.status === 200 &&
          r.json('quantity') === 3,
      })) return;

      const processing = apiClient.patch(
        endpoint,
        { status: 'PROCESSING' },
        { tags: { operation: 'process_order' } }
      );

      if (!check(processing, {
        'processing succeeds': (r) =>
          r.status === 200 &&
          r.json('status') === 'PROCESSING',
      })) return;

      const completed = apiClient.patch(
        endpoint,
        { status: 'COMPLETED' },
        { tags: { operation: 'complete_order' } }
      );

      check(completed, {
        'completion succeeds': (r) =>
          r.status === 200 &&
          r.json('status') === 'COMPLETED',
      });
    } finally {
      if (endpoint) {
        const deleted = apiClient.delete(endpoint, {
          tags: { operation: 'delete_order' },
        });

        check(deleted, {
          'order cleanup succeeds': (r) =>
            r.status === 204,
        });
      }
    }
  });
}
