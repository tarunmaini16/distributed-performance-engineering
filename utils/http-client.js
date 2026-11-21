
import http from 'k6/http';
import { getConfig } from '../config/environment.js';

const config = getConfig();

function buildUrl(endpoint) {
  if (!endpoint.startsWith('/')) {
    throw new Error(`Endpoint must start with '/': ${endpoint}`);
  }

  return `${config.baseUrl.replace(/\/$/, '')}${endpoint}`;
}

function buildParams(options = {}) {
  const { token, headers = {}, ...params } = options;

  return {
    ...params,
    timeout: params.timeout ?? config.timeout,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };
}

function send(method, endpoint, body, options = {}) {
  const url = buildUrl(endpoint);
  const params = buildParams(options);
  
  params.tags = {
  ...params.tags,
  name: params.tags?.name ??
    `${method} ${endpoint.replace(
      /\/[0-9a-f]{8}-[0-9a-f-]{27,}/gi,
      '/:id'
    )}`,
};

  let payload = body;

  if (body !== undefined && body !== null) {
    if (
      typeof body === 'object' &&
      !(body instanceof ArrayBuffer)
    ) {
      payload = JSON.stringify(body);
      params.headers['Content-Type'] ??= 'application/json';
    }
  }

  return http.request(method, url, payload ?? null, params);
}

export const apiClient = {
  get(endpoint, options = {}) {
    return send('GET', endpoint, null, options);
  },

  post(endpoint, body, options = {}) {
    return send('POST', endpoint, body, options);
  },

  put(endpoint, body, options = {}) {
    return send('PUT', endpoint, body, options);
  },

  patch(endpoint, body, options = {}) {
    return send('PATCH', endpoint, body, options);
  },

  delete(endpoint, options = {}) {
    return send('DELETE', endpoint, null, options);
  },
};
