
export function buildOrder(overrides = {}) {
  return {
    product: 'Laptop',
    quantity: 2,
    ...overrides,
  };
}

export function buildInvalidOrderCases() {
  return [
    {
      name: 'missing product',
      payload: { quantity: 2 },
    },
    {
      name: 'empty product',
      payload: { product: '', quantity: 2 },
    },
    {
      name: 'zero quantity',
      payload: buildOrder({ quantity: 0 }),
    },
    {
      name: 'negative quantity',
      payload: buildOrder({ quantity: -1 }),
    },
    {
      name: 'non-integer quantity',
      payload: buildOrder({ quantity: 1.5 }),
    },
    {
      name: 'string quantity',
      payload: buildOrder({ quantity: 'two' }),
    },
  ];
}
