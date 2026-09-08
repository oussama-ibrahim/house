import { LANGUAGES, isRightToLeft, ui } from '../i18n/index.js';
import { LAYOUTS, VIEW_MODES } from '../spec/presentation.js';

export const LEVEL_MODES = Object.freeze(['both', 'ground', 'first']);
const TOGGLES = Object.freeze(['roof', 'labels', 'dimensions']);
const ANGLES = Object.freeze(['azimuth', 'polar']);

function flag(value) {
  if (value === '0') return false;
  if (value === '1') return true;
  return undefined;
}

/**
 * Initial view from URL query parameters, e.g. `?levels=ground&mode=full&layout=assembled&roof=1&lang=ar`.
 * Unknown or missing values are left out so the viewer keeps its defaults.
 */
export function viewStateFromParams(params) {
  const state = {};
  const levels = params.get('levels');
  if (LEVEL_MODES.includes(levels)) state.levels = levels;
  const mode = params.get('mode');
  if (VIEW_MODES.includes(mode)) state.mode = mode;
  const layout = params.get('layout');
  if (LAYOUTS.includes(layout)) state.layout = layout;
  const lang = params.get('lang');
  if (LANGUAGES.includes(lang)) state.language = lang;
  // Camera angles in radians, for sharing or capturing a particular view such as an elevation.
  for (const name of ANGLES) {
    const value = Number.parseFloat(params.get(name));
    if (Number.isFinite(value)) state[name] = value;
  }
  for (const name of TOGGLES) {
    const value = flag(params.get(name));
    if (value !== undefined) state[name] = value;
  }
  return state;
}

/** Writes every `data-i18n` element's text for the language and sets the document's direction. */
export function applyLanguage(root, language) {
  for (const element of root.querySelectorAll('[data-i18n]')) element.textContent = ui(element.dataset.i18n, language);
  document.documentElement.lang = language;
  document.documentElement.dir = isRightToLeft(language) ? 'rtl' : 'ltr';
}

/** Wires the toolbar buttons to the viewer and keeps their pressed state in step with it. */
export function bindToolbar(toolbar, viewer, { page = document } = {}) {
  const pressGroup = (attribute, value) => {
    for (const button of toolbar.querySelectorAll(`button[${attribute}]`)) {
      button.setAttribute('aria-pressed', String(button.getAttribute(attribute) === value));
    }
  };
  const toggleButton = (name) => toolbar.querySelector(`button[data-toggle="${name}"]`);
  const setters = { roof: viewer.setRoof, labels: viewer.setLabels, dimensions: viewer.setDimensions };

  function selectLevels(mode) {
    viewer.setLevels(mode);
    pressGroup('data-levels', mode);
  }

  function selectMode(mode) {
    viewer.setMode(mode);
    pressGroup('data-mode', mode);
  }

  function selectLayout(layout) {
    viewer.setLayout(layout);
    pressGroup('data-layout', layout);
  }

  function setToggle(name, on) {
    setters[name](on);
    toggleButton(name)?.setAttribute('aria-pressed', String(on));
  }

  function selectLanguage(language) {
    viewer.setLanguage(language);
    applyLanguage(page, language);
  }

  function applyState(state) {
    if (state.levels) selectLevels(state.levels);
    if (state.mode) selectMode(state.mode);
    if (state.layout) selectLayout(state.layout);
    if (state.language) selectLanguage(state.language);
    for (const name of TOGGLES) if (state[name] !== undefined) setToggle(name, state[name]);
    if (ANGLES.some((name) => state[name] !== undefined)) viewer.setAngles({ azimuth: state.azimuth, polar: state.polar });
  }

  toolbar.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !toolbar.contains(button)) return;
    const { levels, mode, layout, toggle, action } = button.dataset;
    if (levels) selectLevels(levels);
    else if (mode) selectMode(mode);
    else if (layout) selectLayout(layout);
    else if (toggle) setToggle(toggle, !viewer.getState()[toggle]);
    else if (action === 'reset') viewer.resetView();
    else if (action === 'language') selectLanguage(viewer.getState().language === 'ar' ? 'en' : 'ar');
  });

  return { selectLevels, selectMode, selectLayout, setToggle, selectLanguage, applyState };
}
