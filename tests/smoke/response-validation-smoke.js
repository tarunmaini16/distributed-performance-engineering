
import { apiClient } from '../../utils/http-client.js';
import {
  validateStatus,
  validateResponseTime,
  validateResponse,
} from '../../utils/response-validator.js';
import { getConfig } from '../../config/environment.js';

const config = getConfig();

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate==1'],
    http_req_failed: ['rate<0.01'],
    http_req_duration: [
      `p(95)<${config.thresholds.p95ResponseTime}`,
    ],
  },
};

export default function () {
  const response = apiClient.get('/');

  validateStatus(response, 200);

  validateResponseTime(
    response,
    config.thresholds.p95ResponseTime
  );

  validateResponse(response, {
    'response body is not empty': (res) =>
      typeof res.body === 'string' &&
      res.body.length > 0,

    'response contains HTML document': (res) =>
      res.body.includes('<html lang="en">'),
  });
}
