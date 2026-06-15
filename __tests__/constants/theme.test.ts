import { Themes, type ThemeName } from '@/constants/theme';

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const THEME_NAMES: ThemeName[] = ['lavender', 'sage', 'water'];
const PALETTE_KEYS = ['text', 'background', 'primary', 'secondary', 'tertiary'] as const;

describe('Themes', () => {
  it('contains all three theme names', () => {
    THEME_NAMES.forEach(name => {
      expect(Themes).toHaveProperty(name);
    });
  });

  THEME_NAMES.forEach(name => {
    describe(`${name} theme`, () => {
      it('has all required palette keys', () => {
        PALETTE_KEYS.forEach(key => {
          expect(Themes[name]).toHaveProperty(key);
        });
      });

      it('all colors are valid 6-digit hex strings', () => {
        PALETTE_KEYS.forEach(key => {
          expect(Themes[name][key]).toMatch(HEX_RE);
        });
      });
    });
  });
});
