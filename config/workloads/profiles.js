
export const workloadProfiles = {
    load: {
        executor: 'ramping-arrival-rate',
        startRate: 10,
        timeUnit: '1m',
        preAllocatedVUs: 10,
        maxVUs: 30,
        stages: [
            { duration: '1m', target: 30 },
            { duration: '1m', target: 60 },
            { duration: '1m', target: 60 },
        ],
        gracefulStop: '30s',
    },

    stress: {
        executor: 'ramping-arrival-rate',
        startRate: 10,
        timeUnit: '1m',
        preAllocatedVUs: 20,
        maxVUs: 100,
        stages: [
            { duration: '1m', target: 60 },
            { duration: '1m', target: 150 },
            { duration: '1m', target: 300 },
            { duration: '1m', target: 300 },
            { duration: '1m', target: 10 },
        ],
        gracefulStop: '30s',
    },

    soak: {
        executor: 'constant-arrival-rate',
        rate: 60,
        timeUnit: '1m',
        duration: '10m',
        preAllocatedVUs: 20,
        maxVUs: 50,
        gracefulStop: '30s',
    },

    distributed: {
        executor: 'constant-arrival-rate',
        rate: 600,
        timeUnit: '1m',
        duration: '2m',
        preAllocatedVUs: 40,
        maxVUs: 100,
        gracefulStop: '30s',
    },

};

export function getWorkloadProfile() {
    const profileName = __ENV.PROFILE || 'load';
    const profile = workloadProfiles[profileName];

    if (!profile) {
        throw new Error(
            `Unsupported workload profile: ${profileName}. ` +
            `Supported: ${Object.keys(workloadProfiles).join(', ')}`
        );
    }

    return profile;
}
