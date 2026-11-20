
import { check } from 'k6';

import { apiClient } from '../utils/http-client.js';
import { buildOrder } from '../data/order-data.js';

import {
  ordersStarted,
  ordersCompleted,
  orderSuccessRate,
  orderJourneyDuration,
  orderOperationDuration,
} from '../metrics/business-metrics.js';

function executeOperation(method, endpoint, body, operation) {
  const options = {
    tags: {
      operation,
      name: `${method} ${endpoint.replace(
        /\/[0-9a-f]{8}-[0-9a-f-]{27,}/gi,
        '/:id'
      )}`,
    },
  };

  let response;

  switch (method) {
    case 'GET':
      response = apiClient.get(endpoint, options);
      break;
    case 'DELETE':
      response = apiClient.delete(endpoint, options);
      break;
    default:
      response = apiClient[method.toLowerCase()](
        endpoint,
        body,
        options
      );
  }

  orderOperationDuration.add(
    response.timings.duration,
    { operation }
  );

  return response;
}

function validateStep(response, name, expectedStatus, validateBody) {
  return check(response, {
    [name]: (r) =>
      r.status === expectedStatus &&
      (!validateBody || validateBody(r)),
  });
}

export function runOrderLifecycle() {
  ordersStarted.add(1);

  const startedAt = Date.now();

  let endpoint;
  let businessSucceeded = false;
  let cleanupSucceeded = true;

  try {
    const created = executeOperation(
      'POST',
      '/api/orders',
      buildOrder(),
      'create_order'
    );

    if (!validateStep(created, 'create succeeds', 201,
      (r) => typeof r.json('id') === 'string')) return;

    endpoint = `/api/orders/${created.json('id')}`;

    const retrieved = executeOperation(
      'GET', endpoint, null, 'get_order'
    );

    if (!validateStep(retrieved, 'get succeeds', 200,
      (r) => r.json('quantity') === 2)) return;

    const updated = executeOperation(
      'PUT',
      endpoint,
      buildOrder({ quantity: 3 }),
      'update_order'
    );

    if (!validateStep(updated, 'update succeeds', 200,
      (r) => r.json('quantity') === 3)) return;

    const processing = executeOperation(
      'PATCH',
      endpoint,
      { status: 'PROCESSING' },
      'process_order'
    );

    if (!validateStep(processing, 'processing succeeds', 200,
      (r) => r.json('status') === 'PROCESSING')) return;

    const completed = executeOperation(
      'PATCH',
      endpoint,
      { status: 'COMPLETED' },
      'complete_order'
    );

    if (!validateStep(completed, 'completion succeeds', 200,
      (r) => r.json('status') === 'COMPLETED')) return;

    businessSucceeded = true;
  } finally {
    try {
      if (endpoint) {
        const deleted = executeOperation(
          'DELETE',
          endpoint,
          null,
          'delete_order'
        );

        cleanupSucceeded = validateStep(
          deleted, 'cleanup succeeds', 204
        );
      }
    } catch (error) {
      cleanupSucceeded = false;
      console.error(`Order cleanup failed: ${error.message}`);
    }

    const succeeded = businessSucceeded && cleanupSucceeded;

    if (succeeded) {
      ordersCompleted.add(1);
    }

    orderSuccessRate.add(succeeded);

    orderJourneyDuration.add(Date.now() - startedAt);
  }
}

