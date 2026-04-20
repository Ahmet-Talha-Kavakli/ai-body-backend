describe('env validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('throws when CLERK key missing', () => {
    delete process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
    expect(() => require('../../src/env')).toThrow('Invalid environment variables');
  });

  it('throws when API_URL invalid', () => {
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_abc';
    process.env.EXPO_PUBLIC_API_URL = 'not-a-url';
    expect(() => require('../../src/env')).toThrow();
  });

  it('passes with valid env', () => {
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_abc';
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';
    expect(() => require('../../src/env')).not.toThrow();
  });
});
