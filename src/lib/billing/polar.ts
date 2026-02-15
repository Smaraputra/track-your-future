import { Polar } from '@polar-sh/sdk';

const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN;

const globalForPolar = globalThis as unknown as {
  polar: Polar | undefined;
};

function createPolarClient(): Polar | null {
  if (!POLAR_ACCESS_TOKEN) return null;

  return new Polar({
    accessToken: POLAR_ACCESS_TOKEN,
    server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  });
}

export const polar: Polar | null =
  globalForPolar.polar ?? createPolarClient();

if (process.env.NODE_ENV !== 'production' && polar) {
  globalForPolar.polar = polar;
}
