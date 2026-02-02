const runtime = typeof chrome !== 'undefined' ? chrome : browser;

const DEFAULT_SETTINGS = {
  apiBaseUrl: 'http://localhost:4100',
  apiKey: '',
  includeVisibleText: true,
  includeSelection: false,
  allowScrollIntoView: false
};

const elements = {
  apiBaseUrl: document.getElementById('apiBaseUrl'),
  apiKey: document.getElementById('apiKey'),
  includeVisibleText: document.getElementById('includeVisibleText'),
  includeSelection: document.getElementById('includeSelection'),
  allowScrollIntoView: document.getElementById('allowScrollIntoView'),
  saveBtn: document.getElementById('saveBtn'),
  testBtn: document.getElementById('testBtn'),
  status: document.getElementById('status')
};

const setStatus = (message, variant) => {
  elements.status.textContent = message;
  elements.status.classList.remove('success', 'error');
  if (variant) {
    elements.status.classList.add(variant);
  }
};

const loadSettings = () =>
  new Promise((resolve) => {
    runtime.storage.sync.get(DEFAULT_SETTINGS, (items) => resolve(items));
  });

const saveSettings = (payload) =>
  new Promise((resolve) => {
    runtime.storage.sync.set(payload, () => resolve());
  });

const init = async () => {
  const settings = await loadSettings();
  elements.apiBaseUrl.value = settings.apiBaseUrl;
  elements.apiKey.value = settings.apiKey;
  elements.includeVisibleText.checked = settings.includeVisibleText;
  elements.includeSelection.checked = settings.includeSelection;
  elements.allowScrollIntoView.checked = settings.allowScrollIntoView || false;
};

const handleSave = async () => {
  const payload = {
    apiBaseUrl: elements.apiBaseUrl.value.trim() || DEFAULT_SETTINGS.apiBaseUrl,
    apiKey: elements.apiKey.value.trim(),
    includeVisibleText: elements.includeVisibleText.checked,
    includeSelection: elements.includeSelection.checked,
    allowScrollIntoView: elements.allowScrollIntoView.checked
  };

  await saveSettings(payload);
  setStatus('Settings saved.', 'success');
};

const handleTest = async () => {
  const baseUrl = (elements.apiBaseUrl.value || DEFAULT_SETTINGS.apiBaseUrl).replace(/\/+$/, '');
  setStatus('Testing connection...');
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    if (!response.ok) {
      throw new Error('MCP health check failed.');
    }
    setStatus('Connection OK.', 'success');
  } catch (error) {
    setStatus(error.message || 'Connection failed.', 'error');
  }
};

init();

elements.saveBtn.addEventListener('click', handleSave);

elements.testBtn.addEventListener('click', handleTest);
