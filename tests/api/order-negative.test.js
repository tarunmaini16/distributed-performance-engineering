
import { check, group } from 'k6';
import { apiClient } from '../../utils/http-client.js';
import { buildInvalidOrderCases } from '../../data/order-data.js';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate==1'],
  },
};

export default function () {
  group('Invalid order creation', () => {
    for (const testCase of buildInvalidOrderCases()) {
      const response = apiClient.post(
        '/api/orders',
        testCase.payload,
        {
          tags: {
            operation: 'create_order',
            scenario_type: 'negative',
          },
        }
      );

      check(response, {
        [`${testCase.name}: returns 400`]: (r) =>
          r.status === 400,

        [`${testCase.name}: error returned`]: (r) =>
          typeof r.json('error') === 'string',
      });
    }
  });

  group('Nonexistent order', () => {
    const response = apiClient.get(
      '/api/orders/nonexistent-order-id',
      {
        tags: {
          operation: 'get_order',
          scenario_type: 'negative',
        },
      }
    );

    check(response, {
      'unknown order returns 404': (r) =>
        r.status === 404,
      'unknown order returns error': (r) =>
        r.json('error') === 'Order not found',
    });
  });
}

