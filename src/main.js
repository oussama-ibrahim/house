import './style.css';
import { createViewer } from './scene/viewer.js';
import { applyLanguage, bindToolbar, viewStateFromParams } from './scene/ui.js';
import { DEFAULT_LANGUAGE } from './i18n/index.js';

function showFailure(container, error) {
  const message = document.createElement('p');
  message.className = 'error';
  message.textContent = `The 3D view could not start: ${error.message}. A browser with WebGL is required.`;
  container.replaceChildren(message);
}

const container = document.getElementById('viewport');
const toolbar = document.getElementById('toolbar');
const initial = viewStateFromParams(new URLSearchParams(window.location.search));
const language = initial.language ?? DEFAULT_LANGUAGE;

try {
  applyLanguage(document, language);
  const viewer = createViewer(container, { language });
  const controls = bindToolbar(toolbar, viewer);
  controls.applyState({ ...initial, language: undefined });
} catch (error) {
  showFailure(container, error);
  throw error;
}
