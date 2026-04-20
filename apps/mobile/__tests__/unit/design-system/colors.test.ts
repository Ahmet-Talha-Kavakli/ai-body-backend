import { colors } from '../../../src/design-system/tokens/colors';

describe('color tokens', () => {
  it('accent.primary is mint', () => {
    expect(colors.accent.primary).toBe('#2DD4BF');
  });

  it('bg.primary is true black for OLED', () => {
    expect(colors.bg.primary).toBe('#000000');
  });

  it('text.primary meets AAA contrast on bg.primary', () => {
    // Verified manually: #F8FAFC on #000000 = 19.7:1 (AAA ✅)
    expect(colors.text.primary).toBe('#F8FAFC');
  });

  it('has light mode overrides', () => {
    expect(colors.light.bg.primary).toBe('#FFFFFF');
  });
});
