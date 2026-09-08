import { describe, expect, it } from 'vitest';
import { viewStateFromParams } from '../src/scene/ui.js';

describe('viewStateFromParams', () => {
  it('reads level mode, view mode, layout, language and the overlay flags', () => {
    expect(viewStateFromParams(new URLSearchParams('levels=ground&mode=full&layout=assembled&roof=0&labels=1&dimensions=1&lang=ar'))).toEqual({
      levels: 'ground',
      mode: 'full',
      layout: 'assembled',
      language: 'ar',
      roof: false,
      labels: true,
      dimensions: true,
    });
    expect(viewStateFromParams(new URLSearchParams('mode=cutaway'))).toEqual({ mode: 'cutaway' });
    expect(viewStateFromParams(new URLSearchParams('azimuth=0&polar=1.4'))).toEqual({ azimuth: 0, polar: 1.4 });
  });

  it('ignores unknown values so the viewer keeps its defaults', () => {
    expect(viewStateFromParams(new URLSearchParams('design=b&levels=roof&mode=xray&layout=stack&lang=fr&roof=maybe&azimuth=east'))).toEqual({});
    expect(viewStateFromParams(new URLSearchParams(''))).toEqual({});
  });
});
