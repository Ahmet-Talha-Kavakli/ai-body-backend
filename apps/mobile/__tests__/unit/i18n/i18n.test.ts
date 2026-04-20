import { setLocale, t } from '../../../src/i18n';

describe('i18n', () => {
  afterEach(() => setLocale('tr'));

  it('translates Turkish key', () => {
    setLocale('tr');
    expect(t('common.loading')).toBe('Yükleniyor...');
  });

  it('translates English key after locale switch', () => {
    setLocale('en');
    expect(t('common.loading')).toBe('Loading...');
  });

  it('falls back to key when missing', () => {
    const result = t('nonexistent.key');
    expect(result).toContain('nonexistent.key');
  });

  it('has all tab labels in both locales', () => {
    const tabs = ['home', 'train', 'nutrition', 'health', 'you'];
    for (const tab of tabs) {
      setLocale('tr');
      expect(t(`tabs.${tab}`)).not.toContain('missing');
      setLocale('en');
      expect(t(`tabs.${tab}`)).not.toContain('missing');
    }
  });
});
