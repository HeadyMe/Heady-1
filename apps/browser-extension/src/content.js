const OVERLAY_ID = 'heady-mcp-overlay-root';

const removeOverlay = () => {
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) {
    existing.remove();
  }
};

const createOverlay = () => {
  removeOverlay();
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.pointerEvents = 'none';
  overlay.style.zIndex = '2147483647';
  document.body.appendChild(overlay);
  return overlay;
};

const highlightElement = (element, label = '') => {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const overlay = createOverlay();
  const box = document.createElement('div');
  box.style.position = 'absolute';
  box.style.left = `${rect.left + window.scrollX}px`;
  box.style.top = `${rect.top + window.scrollY}px`;
  box.style.width = `${rect.width}px`;
  box.style.height = `${rect.height}px`;
  box.style.border = '2px solid rgba(79, 209, 197, 0.8)';
  box.style.borderRadius = '8px';
  box.style.boxShadow = '0 0 16px rgba(79, 209, 197, 0.35)';
  box.style.background = 'rgba(79, 209, 197, 0.08)';
  overlay.appendChild(box);

  if (label) {
    const badge = document.createElement('div');
    badge.textContent = label;
    badge.style.position = 'absolute';
    badge.style.left = `${rect.left + window.scrollX}px`;
    badge.style.top = `${Math.max(rect.top + window.scrollY - 24, 8)}px`;
    badge.style.padding = '4px 8px';
    badge.style.borderRadius = '999px';
    badge.style.fontSize = '11px';
    badge.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    badge.style.letterSpacing = '0.08em';
    badge.style.textTransform = 'uppercase';
    badge.style.color = '#0f172a';
    badge.style.background = 'rgba(79, 209, 197, 0.9)';
    badge.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.25)';
    overlay.appendChild(badge);
  }

  setTimeout(removeOverlay, 1200);
};

const showToast = (message) => {
  const overlay = createOverlay();
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.right = '16px';
  toast.style.bottom = '16px';
  toast.style.padding = '10px 14px';
  toast.style.borderRadius = '12px';
  toast.style.fontSize = '12px';
  toast.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  toast.style.color = '#e2e8f0';
  toast.style.background = 'rgba(15, 23, 42, 0.92)';
  toast.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.35)';
  toast.style.maxWidth = '240px';
  overlay.appendChild(toast);
  setTimeout(removeOverlay, 1400);
};

const isElementVisible = (element) => {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) {
    return false;
  }
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  );
};

const resolveTarget = (action) => {
  if (action.selector) {
    return document.querySelector(action.selector);
  }
  if (action.xpath) {
    const result = document.evaluate(action.xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue;
  }
  if (action.targetText) {
    const elements = Array.from(document.querySelectorAll('button, a, input, textarea, select, [role="button"], [role="link"]'));
    return elements.find((el) => el.textContent && el.textContent.trim() === action.targetText.trim());
  }
  return null;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const applyAction = async (action, mode) => {
  const actionType = action.action || action.type;

  if (actionType === 'wait') {
    await delay(action.delayMs || 500);
    return { waited: action.delayMs || 500 };
  }

  if (actionType === 'scroll') {
    const scrollOptions = action.scrollTo
      ? { top: action.scrollTo.y || 0, left: action.scrollTo.x || 0, behavior: 'smooth' }
      : { top: action.scrollBy?.y || 0, left: action.scrollBy?.x || 0, behavior: 'smooth' };
    window.scrollTo(scrollOptions);
    await delay(350);
    return { scrolled: true };
  }

  const target = resolveTarget(action);
  if (!target) {
    throw new Error(`Target not found for ${actionType || 'action'}.`);
  }

  if (!isElementVisible(target)) {
    if (action.allowScrollIntoView) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await delay(450);
    } else {
      throw new Error('Target is not visible in the viewport.');
    }
  }

  if (mode === 'preview') {
    highlightElement(target, actionType || 'preview');
    return { previewed: true };
  }

  highlightElement(target, actionType || 'action');

  if (actionType === 'click') {
    target.click();
    return { clicked: true };
  }

  if (actionType === 'focus') {
    target.focus();
    return { focused: true };
  }

  if (actionType === 'input') {
    const value = action.value ?? action.text ?? '';
    target.focus();
    target.value = value;
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
    return { input: value };
  }

  if (actionType === 'select') {
    const value = action.value ?? '';
    target.value = value;
    target.dispatchEvent(new Event('change', { bubbles: true }));
    return { selected: value };
  }

  if (actionType === 'keypress') {
    const key = action.key || 'Enter';
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    target.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
    return { keypress: key };
  }

  if (actionType === 'extract') {
    return { text: target.innerText || target.value || '' };
  }

  throw new Error(`Unsupported action: ${actionType}`);
};

const applyActions = async (actions = [], mode = 'preview') => {
  const results = [];
  for (const action of actions) {
    if (document.visibilityState !== 'visible') {
      results.push({ action, status: 'skipped', reason: 'Tab not visible.' });
      continue;
    }
    try {
      const result = await applyAction(action, mode);
      results.push({ action, status: 'ok', result });
      if (action.delayMs) {
        await delay(action.delayMs);
      }
    } catch (error) {
      results.push({ action, status: 'error', error: error.message || String(error) });
      if (action.required) {
        break;
      }
    }
  }
  return results;
};

const collectContext = ({ includeVisibleText, includeSelection }) => {
  let visibleText = '';
  if (includeVisibleText) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!node.parentElement) return NodeFilter.FILTER_REJECT;
        const tag = node.parentElement.tagName;
        if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(tag)) return NodeFilter.FILTER_REJECT;
        if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        const rect = node.parentElement.getBoundingClientRect();
        const inViewport =
          rect.bottom > 0 &&
          rect.right > 0 &&
          rect.top < window.innerHeight &&
          rect.left < window.innerWidth;
        return inViewport ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    let node;
    while ((node = walker.nextNode())) {
      visibleText += `${node.textContent.trim()} `;
      if (visibleText.length > 4000) break;
    }

    visibleText = visibleText.trim();
  }

  const selection = includeSelection ? window.getSelection()?.toString() : '';

  return {
    visibleText,
    selection,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    }
  };
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    return false;
  }

  if (message.type === 'HEADY_MCP_COLLECT_CONTEXT') {
    try {
      const context = collectContext(message);
      sendResponse(context);
    } catch (error) {
      sendResponse({ error: error.message || String(error) });
    }
    return true;
  }

  if (message.type === 'HEADY_MCP_APPLY_ACTIONS') {
    (async () => {
      try {
        if (!message.actions || !message.actions.length) {
          showToast('No actions returned by MCP.');
          sendResponse({ ok: true, results: [] });
          return;
        }
        const results = await applyActions(message.actions, message.mode || 'preview');
        sendResponse({ ok: true, results });
      } catch (error) {
        sendResponse({ ok: false, error: error.message || String(error) });
      }
    })();
    return true;
  }

  return false;
});
