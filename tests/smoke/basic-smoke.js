
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const response = http.get('https://test.k6.io/');

  check(response, {
    'HTTP status is 200': (res) => res.status === 200,
    'response body is not empty': (res) => res.body.length > 0,
    'response contains expected content': (res) =>
      res.body.includes('Collection of simple web-pages'),
  });
}
