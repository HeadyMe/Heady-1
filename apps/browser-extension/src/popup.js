const runtime = typeof chrome !== 'undefined' ? chrome : browser;

const DEFAULT_SETTINGS = {
  apiBaseUrl: 'http://localhost:4100',
  apiKey: '',
  includeVisibleText: true,
  includeSelection: false,
  allowScrollIntoView: false
};

const elements = {
  intent: document.getElementById('intent'),
  includeVisibleText: document.getElementById('includeVisibleText'),
  includeSelection: document.getElementById('includeSelection'),
  allowScrollIntoView: document.getElementById('allowScrollIntoView'),
  previewBtn: document.getElementById('previewBtn'),
  executeBtn: document.getElementById('executeBtn'),
  confirmExecute: document.getElementById('confirmExecute'),
  status: document.getElementById('status'),
  actionsList: document.getElementById('actionsList'),
  actionCount: document.getElementById('actionCount'),
  apiBase: document.getElementById('apiBase'),
  pingBtn: document.getElementById('pingBtn'),
  requestAccessBtn: document.getElementById('requestAccessBtn'),
  openOptions: document.getElementById('openOptions')
};

let lastIntent = '';
let lastActions = [];

const getSettings = () =>
  new Promise((resolve) => {
    runtime.storage.sync.get(DEFAULT_SETTINGS, (items) => resolve(items));
  });

const setStatus = (message, variant) => {
  elements.status.textContent = message;
  elements.status.classList.remove('error', 'success');
  if (variant) {
    elements.status.classList.add(variant);
  }
};

const setBusy = (busy) => {
  elements.previewBtn.disabled = busy;
  elements.executeBtn.disabled = busy || !elements.confirmExecute.checked || lastIntent !== elements.intent.value.trim();
};

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const renderActions = (actions) => {
  elements.actionCount.textContent = actions.length;
  if (!actions.length) {
    elements.actionsList.innerHTML = '<li class="empty">No actions returned.</li>';
    return;
  }

  elements.actionsList.innerHTML = actions
    .map((action) => {
      const label = action.action || action.type || 'action';
      const target = action.selector || action.targetText || action.xpath || '';
      const detail = target ? `Target: ${escapeHtml(target)}` : 'Target: auto';
      return `
        <li>
          <strong>${escapeHtml(label)}</strong>
          <span>${detail}</span>
        </li>
      `;
    })
    .join('');
};

const sendMessage = (payload) =>
  new Promise((resolve) => {
    runtime.runtime.sendMessage(payload, (response) => resolve(response));
  });

const runTask = async (mode) => {
  const intent = elements.intent.value.trim();
  if (!intent) {
    setStatus('Add a clear task intent first.', 'error');
    return;
  }

  if (mode === 'execute') {
    if (!elements.confirmExecute.checked) {
      setStatus('Confirm execution before running actions.', 'error');
      return;
    }
    if (intent !== lastIntent) {
      setStatus('Intent changed. Preview again before executing.', 'error');
      return;
    }
  }

  setBusy(true);
  setStatus(mode === 'preview' ? 'Previewing actions...' : 'Executing actions...');

  const response = await sendMessage({
    type: 'HEADY_MCP_RUN',
    intent,
    mode,
    includeVisibleText: elements.includeVisibleText.checked,
    includeSelection: elements.includeSelection.checked,
    allowScrollIntoView: elements.allowScrollIntoView.checked
  });

  setBusy(false);

  if (!response || !response.ok) {
    setStatus(response?.error || 'Failed to run MCP task.', 'error');
    return;
  }

  lastIntent = intent;
  lastActions = response.actions || [];
  renderActions(lastActions);

  if (mode === 'preview') {
    setStatus(`Preview ready. ${lastActions.length} action(s) returned.`, 'success');
  } else {
    setStatus(`Execution complete. ${lastActions.length} action(s) attempted.`, 'success');
  }

  elements.executeBtn.disabled = !elements.confirmExecute.checked || lastIntent !== elements.intent.value.trim();
};

const pingMcp = async () => {
  const settings = await getSettings();
  const baseUrl = settings.apiBaseUrl.replace(/\/+$/, '');
  setStatus('Checking MCP health...');
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    if (!response.ok) {
      throw new Error('Health check failed.');
    }
    setStatus('MCP is reachable.', 'success');
  } catch (error) {
    setStatus(error.message || 'Could not reach MCP.', 'error');
  }
};

const requestAccess = () => {
  if (!runtime.permissions) {
    setStatus('Permissions API unavailable in this browser.', 'error');
    return;
  }

  runtime.permissions.request({ origins: ['https://*/*', 'http://*/*'] }, (granted) => {
    if (granted) {
      setStatus('Full site access granted.', 'success');
    } else {
      setStatus('Full site access was not granted.', 'error');
    }
  });
};

const init = async () => {
  const settings = await getSettings();
  elements.apiBase.textContent = settings.apiBaseUrl;
  elements.includeVisibleText.checked = settings.includeVisibleText;
  elements.includeSelection.checked = settings.includeSelection;
  elements.allowScrollIntoView.checked = settings.allowScrollIntoView || false;
};

init();

['input', 'change'].forEach((event) => {
  elements.intent.addEventListener(event, () => {
    elements.executeBtn.disabled = !elements.confirmExecute.checked || lastIntent !== elements.intent.value.trim();
  });
});

elements.confirmExecute.addEventListener('change', () => {
  elements.executeBtn.disabled = !elements.confirmExecute.checked || lastIntent !== elements.intent.value.trim();
});

elements.previewBtn.addEventListener('click', () => runTask('preview'));

elements.executeBtn.addEventListener('click', () => runTask('execute'));

elements.pingBtn.addEventListener('click', pingMcp);

elements.requestAccessBtn.addEventListener('click', requestAccess);

elements.openOptions.addEventListener('click', () => runtime.runtime.openOptionsPage());
