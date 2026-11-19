
import http from 'k6/http';
import { check } from 'k6';
import { Rate } from 'k6/metrics';

const checkSuccessRate = new Rate('check_success_rate');

export const options = {
  vus: 1,
  iterations: 1,

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
    check_success_rate: ['rate==1'],
  },
};

export default function () {
  const response = http.get('https://test.k6.io/');

  const assertions = {
    'HTTP status is 200': response.status === 200,
    'response body is not empty': response.body.length > 0,
    'response contains expected HTML':
      response.body.includes('QuickPizza'),
  };

  Object.values(assertions).forEach((passed) => {
    checkSuccessRate.add(passed);
  });

  check(
    response,
    Object.fromEntries(
      Object.entries(assertions).map(([name, passed]) => [
        name,
        () => passed,
      ])
    )
  );
}
