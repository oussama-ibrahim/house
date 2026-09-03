import { describe, expect, it } from 'vitest';
import { UI, LANGUAGES, metres, sceneDictionary, t, ui } from '../src/i18n/index.js';
import { LEVEL_SPECS } from '../src/model/house.js';

describe('translations', () => {
  it('has every UI string in every language', () => {
    const keys = Object.keys(UI.en);
    for (const language of LANGUAGES) {
      for (const key of keys) expect(ui(key, language), `${language}.${key}`).toBeTruthy();
    }
  });

  it('has an Arabic entry for every level name, pin and room', () => {
    const arabic = sceneDictionary('ar');
    for (const spec of LEVEL_SPECS) {
      expect(arabic[spec.name], spec.name).toBeTruthy();
      for (const pin of spec.labels) expect(arabic[pin.text], pin.text).toBeTruthy();
      for (const room of spec.rooms) expect(arabic[room.name], room.name).toBeTruthy();
    }
    for (const unit of ['m', 'm²', 'gross', 'net']) expect(arabic[unit], unit).toBeTruthy();
  });

  it('falls back to the English text for anything unlisted', () => {
    expect(t('Something new', 'ar')).toBe('Something new');
    expect(t('Sofa', 'en')).toBe('Sofa');
  });

  it('keeps Latin digits in both languages', () => {
    expect(metres(6, 'en')).toBe('6.00 m');
    expect(metres(6, 'ar')).toBe('6.00 م');
    for (const text of [metres(6, 'ar'), ui('title', 'ar'), ui('hint', 'ar')]) expect(text).not.toMatch(/[٠-٩]/);
  });
});
