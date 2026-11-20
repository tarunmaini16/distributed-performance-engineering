
import { getConfig } from '../../config/environment.js';
import { getWorkloadProfile } from '../../config/workloads/profiles.js';
import { runOrderLifecycle } from '../../journeys/order-lifecycle.js';

const config = getConfig();
const profile = getWorkloadProfile();
const profileName = __ENV.PROFILE || 'load';

export const options = {
  scenarios: {
    order_lifecycle: {
      ...profile,
      tags: {
        workload: profileName,
        application: 'order-api',
      },
    },
  },

  thresholds: {
    checks: ['rate==1'],

    http_req_failed: [
      `rate<${config.thresholds.maxFailureRate}`,
    ],

    http_req_duration: [
      `p(95)<${config.thresholds.p95ResponseTime}`,
    ],

    dropped_iterations: ['count==0'],

    // Business-level quality gates.
    order_success_rate: ['rate==1'],
    order_journey_duration: ['p(95)<500'],
  },
};

export default function () {
  runOrderLifecycle();
}
