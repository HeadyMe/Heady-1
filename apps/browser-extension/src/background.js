const DEFAULT_SETTINGS = {
  apiBaseUrl: 'http://localhost:4100',
  apiKey: '',
  includeVisibleText: true,
  includeSelection: false
};

const normalizeBaseUrl = (url) => (url || '').replace(/\/+$/, '');

const getSettings = () =>
  new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => resolve(items));
  });

const getActiveTab = () =>
  new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (!tab) {
        reject(new Error('No active tab found.'));
        return;
      }
      resolve(tab);
    });
  });

const sendMessageToTab = (tabId, message) =>
  new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });

const ensureContentScript = async (tabId) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content.js']
    });
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    if (message.includes('Cannot access a chrome://') || message.includes('URL scheme')) {
      throw new Error('Cannot access this page. Try a normal web page.');
    }
  }
};

const extractActions = (payload) => {
  if (!payload) return [];
  const data = payload.result || payload;
  if (Array.isArray(data.actions)) return data.actions;
  if (Array.isArray(data.plan && data.plan.actions)) return data.plan.actions;
  if (Array.isArray(data.steps)) return data.steps;
  return [];
};

const callMcp = async (task, apiBaseUrl, apiKey) => {
  const endpoint = `${normalizeBaseUrl(apiBaseUrl)}/api/task/execute`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-api-key': apiKey } : {})
    },
    body: JSON.stringify(task)
  });

  if (!response.ok) {
    throw new Error(`MCP request failed (${response.status}).`);
  }

  return response.json();
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== 'HEADY_MCP_RUN') {
    return false;
  }

  (async () => {
    try {
      const { intent, mode, includeVisibleText, includeSelection } = message;
      if (!intent || !intent.trim()) {
        throw new Error('Add a task intent to continue.');
      }

      const tab = await getActiveTab();
      if (!tab.id) {
        throw new Error('Active tab not available.');
      }

      await ensureContentScript(tab.id);

      const context = await sendMessageToTab(tab.id, {
        type: 'HEADY_MCP_COLLECT_CONTEXT',
        includeVisibleText,
        includeSelection
      });

      const settings = await getSettings();
      const task = {
        type: 'browser_automation',
        description: intent.trim(),
        context: {
          url: tab.url,
          title: tab.title,
          viewport: context && context.viewport,
          visibleText: context && context.visibleText,
          selection: context && context.selection,
          mode
        }
      };

      const response = await callMcp(task, settings.apiBaseUrl, settings.apiKey);
      const actions = extractActions(response);

      const execution = await sendMessageToTab(tab.id, {
        type: 'HEADY_MCP_APPLY_ACTIONS',
        mode,
        actions
      });

      sendResponse({ ok: true, actions, execution, raw: response });
    } catch (error) {
      sendResponse({ ok: false, error: error.message || String(error) });
    }
  })();

  return true;
});
