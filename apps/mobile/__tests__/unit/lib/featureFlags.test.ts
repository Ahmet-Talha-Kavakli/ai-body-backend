import { isFeatureEnabled, growthbook } from '../../../src/lib/featureFlags';

describe('featureFlags', () => {
  it('returns false for unknown feature', () => {
    expect(isFeatureEnabled('nonexistent_feature')).toBe(false);
  });

  it('setAttributes does not throw', () => {
    expect(() => {
      growthbook.setAttributes({ id: 'test-user', loggedIn: true });
    }).not.toThrow();
  });
});
