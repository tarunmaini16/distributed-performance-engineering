
const configs = {
  dev: JSON.parse(open('./dev.json')),
  staging: JSON.parse(open('./staging.json')),
  local: JSON.parse(open('./local.json')),
};

export function getConfig() {
  const environment = __ENV.ENV || 'dev';
  const config = configs[environment];

  if (!config) {
    throw new Error(
      `Unsupported environment: ${environment}. ` +
      `Supported: ${Object.keys(configs).join(', ')}`
    );
  }

  if (!config.baseUrl || !config.timeout) {
    throw new Error(
      `Missing required configuration for: ${environment}`
    );
  }

  return config;
}
