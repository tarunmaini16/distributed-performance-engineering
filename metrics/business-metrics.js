
import { Counter, Rate, Trend } from 'k6/metrics';

// Number of business journeys started and completed.
export const ordersStarted = new Counter('orders_started');
export const ordersCompleted = new Counter('orders_completed');

// One sample per journey: true or false.
export const orderSuccessRate = new Rate('order_success_rate');

// End-to-end journey duration, including cleanup.
export const orderJourneyDuration = new Trend(
  'order_journey_duration',
  true
);

// Latency of individual API operations.
export const orderOperationDuration = new Trend(
  'order_operation_duration',
  true
);
