
import { check } from 'k6';

import {
  validateStatus,
  validateJsonFields,
  validateJsonSchema,
  parseJson,
} from '../../utils/response-validator.js';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate==1'],
  },
};

export default function () {
  const response = {
    status: 200,
    body: JSON.stringify({
      id: 101,
      name: 'Performance Test',
      active: true,
      tags: ['api', 'k6'],
      metadata: { environment: 'dev' },
    }),
  };

  validateStatus(response, 200);

  validateJsonFields(response, {
    id: 101,
    name: 'Performance Test',
    active: true,
  });

  validateJsonSchema(response, {
    id: 'number',
    name: 'string',
    active: 'boolean',
    tags: 'array',
    metadata: 'object',
  });

  // Negative scenario: invalid JSON must be rejected.
  let invalidJsonRejected = false;

  try {
    parseJson({ body: '{invalid-json}' });
  } catch (error) {
    invalidJsonRejected = error.message.includes(
      'Invalid JSON response'
    );
  }

  check(null, {
    'invalid JSON is rejected': () => invalidJsonRejected,
  });
}
