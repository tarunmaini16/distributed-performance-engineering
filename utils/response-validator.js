
import { check } from 'k6';

/**
 * Runs named assertions against a response.
 * Results are recorded in k6's built-in checks metric.
 */
export function validateResponse(response, assertions) {
  return check(response, assertions);
}

export function validateStatus(response, expectedStatus = 200) {
  return validateResponse(response, {
    [`status is ${expectedStatus}`]: (res) =>
      res.status === expectedStatus,
  });
}

export function validateResponseTime(response, maxMs) {
  return validateResponse(response, {
    [`response time below ${maxMs}ms`]: (res) =>
      res.timings.duration < maxMs,
  });
}

export function parseJson(response) {
  try {
    return JSON.parse(response.body);
  } catch (error) {
    throw new Error(
      `Invalid JSON response: ${error.message}`
    );
  }
}

export function validateJsonFields(response, expectedFields) {
  let body;

  try {
    body = parseJson(response);
  } catch (error) {
    return validateResponse(response, {
      'response contains valid JSON': () => false,
    });
  }

  const assertions = {
    'response contains valid JSON': () => true,
  };

  for (const [field, expectedValue] of Object.entries(expectedFields)) {
    assertions[`field ${field} matches expected value`] = () =>
      Object.prototype.hasOwnProperty.call(body, field) &&
      body[field] === expectedValue;
  }

  return validateResponse(response, assertions);
}

/**
 * Lightweight schema validation.
 * Supports required fields and primitive JSON types.
 */
export function validateJsonSchema(response, schema) {
  let body;

  try {
    body = parseJson(response);
  } catch (error) {
    return validateResponse(response, {
      'schema: response contains valid JSON': () => false,
    });
  }

  const assertions = {};

  for (const [field, expectedType] of Object.entries(schema)) {
    assertions[`schema: ${field} is ${expectedType}`] = () => {
      if (
        body === null ||
        typeof body !== 'object' ||
        Array.isArray(body) ||
        !Object.prototype.hasOwnProperty.call(body, field)
      ) {
        return false;
      }

      const value = body[field];

      if (expectedType === 'array') {
        return Array.isArray(value);
      }

      if (expectedType === 'null') {
        return value === null;
      }

      if (expectedType === 'object') {
        return value !== null &&
          typeof value === 'object' &&
          !Array.isArray(value);
      }

      return typeof value === expectedType;
    };
  }

  return validateResponse(response, assertions);
}
