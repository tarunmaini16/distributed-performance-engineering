
import { check } from 'k6';
import { apiClient } from '../../utils/http-client.js';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate==1'],
  },
};

export default function () {
  let rejected = false;

  try {
    apiClient.get('invalid-endpoint');
  } catch (error) {
    rejected = error.message.includes(
      "Endpoint must start with '/'"
    );
  }

  check(null, {
    'client rejects invalid endpoints': () => rejected,
  });
}
