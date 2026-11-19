
import { check } from 'k6';
import { apiClient } from '../../utils/http-client.js';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate==1'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const response = apiClient.get('/');

  check(response, {
    'GET returns HTTP 200': (res) => res.status === 200,
    'GET returns non-empty body': (res) =>
      typeof res.body === 'string' && res.body.length > 0,
  });
}
