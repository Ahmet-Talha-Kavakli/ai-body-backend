describe('env validation', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('throws when CLERK key missing', () => {
    const saved = process.env['EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'];
    delete process.env['EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'];
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      expect(() => require('../../src/env')).toThrow('Invalid environment variables');
    });
    process.env['EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'] = saved;
  });

  it('throws when API_URL invalid', () => {
    const saved = process.env['EXPO_PUBLIC_API_URL'];
    process.env['EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'] = 'pk_test_abc';
    process.env['EXPO_PUBLIC_API_URL'] = 'not-a-url';
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      expect(() => require('../../src/env')).toThrow();
    });
    process.env['EXPO_PUBLIC_API_URL'] = saved;
  });

  it('passes with valid env', () => {
    process.env['EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'] = 'pk_test_abc';
    process.env['EXPO_PUBLIC_API_URL'] = 'http://localhost:3000';
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      expect(() => require('../../src/env')).not.toThrow();
    });
  });
});
