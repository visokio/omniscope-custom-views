const treeContainer = document.getElementById('treeContainer');
const detailsContent = document.getElementById('detailsContent');
const rowSelector = document.getElementById('rowSelector');
const rowSelectorContainer = document.getElementById('rowSelectorContainer');
const searchInput = document.getElementById('searchInput');
const expandAllBtn = document.getElementById('expandAllBtn');
const collapseAllBtn = document.getElementById('collapseAllBtn');
const rootOnlyToggle = document.getElementById('rootOnlyToggle');
const errorCard = document.getElementById('errorCard');
const configNotice = document.getElementById('configNotice');
const toastContainer = document.getElementById('toastContainer');

const state = {
  rows: [],
  rowLabels: [],
  settings: {},
  jsonColumn: null,
  currentRowIndex: 0,
  rootNode: null,
  nodeMap: new Map(),
  expanded: new Set(),
  selectedId: null,
  focusedId: null,
  searchTerm: '',
  searchMatches: new Set(),
  searchVisible: new Set(),
  rootOnly: false,
  renderOrder: [],
  pendingParseId: 0,
  pendingQueryId: 0,
  parseWorker: null,
  lastRawText: '',
};

const WORKER_THRESHOLD_BYTES = 5 * 1024 * 1024;
const VIRTUAL_LIMIT = 500;
const CHUNK_SIZE = 200;

function init() {
  searchInput.addEventListener('input', handleSearchInput);
  expandAllBtn.addEventListener('click', () => {
    expandAll();
    renderTree();
  });
  collapseAllBtn.addEventListener('click', () => {
    collapseAll();
    renderTree();
  });
  rootOnlyToggle.addEventListener('change', () => {
    state.rootOnly = rootOnlyToggle.checked;
    if (state.rootNode && state.rootOnly) {
      state.expanded.add(state.rootNode.id);
    }
    renderTree();
  });
  rowSelector.addEventListener('change', () => {
    const idx = Number(rowSelector.value);
    selectRow(idx);
  });
  treeContainer.addEventListener('keydown', onTreeKeyDown);
  treeContainer.addEventListener('click', (ev) => {
    const nodeEl = ev.target.closest('[data-node-id]');
    if (!nodeEl) return;
    const nodeId = nodeEl.dataset.nodeId;
    const target = ev.target;
    if (target.classList.contains('node-toggle') || target.closest('.node-toggle')) {
      toggleNodeExpansion(nodeId);
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    selectNode(nodeId, true);
  });
}

function handleSearchInput() {
  const value = searchInput.value.trim();
  state.searchTerm = value;
  debounceSearch();
}

let searchDebounceHandle = null;
function debounceSearch() {
  if (searchDebounceHandle) {
    clearTimeout(searchDebounceHandle);
  }
  searchDebounceHandle = setTimeout(runSearch, 200);
}

function runSearch() {
  searchDebounceHandle = null;
  const term = state.searchTerm.toLowerCase();
  state.searchMatches.clear();
  state.searchVisible.clear();
  if (!state.rootNode) {
    renderTree();
    return;
  }
  if (!term) {
    renderTree();
    return;
  }
  const matches = new Set();
  const visible = new Set();
  function traverse(node) {
    let selfMatch = false;
    if (node.key && typeof node.key === 'string') {
      if (node.key.toLowerCase().includes(term)) {
        selfMatch = true;
      }
    }
    if (['string', 'number', 'boolean', 'null'].includes(node.type)) {
      const preview = (node.valuePreview || '').toLowerCase();
      if (preview.includes(term)) {
        selfMatch = true;
      }
    }
    let childMatched = false;
    if (node.type === 'object' || node.type === 'array') {
      const children = ensureChildren(node, true);
      for (const child of children) {
        const childResult = traverse(child);
        if (childResult) {
          childMatched = true;
        }
      }
    }
    if (selfMatch) {
      matches.add(node.id);
    }
    if (selfMatch || childMatched) {
      visible.add(node.id);
      if (node.parentId) {
        visible.add(node.parentId);
      }
      return true;
    }
    return false;
  }
  traverse(state.rootNode);
  state.searchMatches = matches;
  state.searchVisible = visible;
  for (const id of visible) {
    state.expanded.add(id);
  }
  renderTree();
}

function expandAll() {
  if (!state.rootNode) return;
  state.expanded.clear();
  function visit(node) {
    if (node.type === 'object' || node.type === 'array') {
      state.expanded.add(node.id);
      const children = ensureChildren(node, true);
      for (const child of children) {
        visit(child);
      }
    }
  }
  visit(state.rootNode);
}

function collapseAll() {
  state.expanded.clear();
  if (state.rootNode) {
    state.expanded.add(state.rootNode.id);
  }
}

function onTreeKeyDown(ev) {
  const active = document.activeElement;
  if (!active || !active.dataset || !active.dataset.nodeId) return;
  const nodeId = active.dataset.nodeId;
  switch (ev.key) {
    case 'ArrowDown':
      ev.preventDefault();
      focusRelative(nodeId, 1);
      break;
    case 'ArrowUp':
      ev.preventDefault();
      focusRelative(nodeId, -1);
      break;
    case 'ArrowRight':
      ev.preventDefault();
      handleArrowRight(nodeId);
      break;
    case 'ArrowLeft':
      ev.preventDefault();
      handleArrowLeft(nodeId);
      break;
    case 'Enter':
    case ' ': {
      ev.preventDefault();
      selectNode(nodeId, true);
      break;
    }
    default:
      break;
  }
}

function focusRelative(nodeId, delta) {
  const idx = state.renderOrder.indexOf(nodeId);
  if (idx === -1) return;
  const nextIdx = idx + delta;
  if (nextIdx < 0 || nextIdx >= state.renderOrder.length) return;
  const nextId = state.renderOrder[nextIdx];
  focusNode(nextId);
}

function handleArrowRight(nodeId) {
  const node = state.nodeMap.get(nodeId);
  if (!node) return;
  if (node.type === 'object' || node.type === 'array') {
    if (!state.expanded.has(nodeId)) {
      state.expanded.add(nodeId);
      renderTree(nodeId);
      focusNode(nodeId);
    } else {
      const children = ensureChildren(node, true);
      if (children.length > 0) {
        const firstChild = children.find((child) => isNodeVisible(child.id));
        if (firstChild) {
          focusNode(firstChild.id);
        }
      }
    }
  }
}

function handleArrowLeft(nodeId) {
  const node = state.nodeMap.get(nodeId);
  if (!node) return;
  if (node.type === 'object' || node.type === 'array') {
    if (state.expanded.has(nodeId)) {
      state.expanded.delete(nodeId);
      renderTree(nodeId);
      focusNode(nodeId);
      return;
    }
  }
  if (node.parentId) {
    focusNode(node.parentId);
  }
}

function focusNode(nodeId) {
  const nodeEl = treeContainer.querySelector(`[data-node-id="${CSS.escape(nodeId)}"]`);
  if (!nodeEl) return;
  treeContainer.querySelectorAll('[data-node-id]').forEach((el) => {
    el.setAttribute('tabindex', '-1');
  });
  nodeEl.setAttribute('tabindex', '0');
  nodeEl.focus({ preventScroll: false });
  state.focusedId = nodeId;
}

function selectNode(nodeId, focus = false) {
  const node = state.nodeMap.get(nodeId);
  if (!node) return;
  state.selectedId = nodeId;
  treeContainer.querySelectorAll('[data-node-id]').forEach((el) => {
    el.setAttribute('aria-selected', el.dataset.nodeId === nodeId ? 'true' : 'false');
  });
  updateDetails(node);
  if (focus) {
    focusNode(nodeId);
  }
  onNodeSelect(node);
}

function onNodeSelect(node) {
  // Hook for future integration; currently no external dispatch
  // Could dispatch CustomEvent if needed
}

function updateDetails(node) {
  if (!node) {
    detailsContent.innerHTML = '<p class="empty-details">Select a node to view details.</p>';
    return;
  }
  const pathText = node.path || '<root>';
  const typeText = node.type;
  const sizeText =
    node.type === 'object'
      ? `${node.size ?? 0} key${node.size === 1 ? '' : 's'}`
      : node.type === 'array'
      ? `${node.size ?? 0} item${node.size === 1 ? '' : 's'}`
      : null;

  const preview = createDetailValue(node);

  detailsContent.innerHTML = `
    <div class="details-row">
      <strong>Path</strong>
      <div class="details-value path-value">
        <span>${escapeHtml(pathText)}</span>
        <button class="copy-btn" type="button">Copy path</button>
      </div>
    </div>
    <div class="details-row">
      <strong>Type</strong>
      <div class="details-value">${escapeHtml(typeText)}${sizeText ? ' · ' + escapeHtml(sizeText) : ''}</div>
    </div>
    <div class="details-row">
      <strong>Value</strong>
      <div class="details-json"><code>${escapeHtml(preview.text)}</code></div>
      ${preview.showMore ? '<button type="button" class="show-more-btn" data-action="show-more">Show more</button>' : ''}
      ${preview.binary ? '<button type="button" class="show-more-btn" data-action="load-chunk">Load chunk</button>' : ''}
    </div>
  `;
  const copyBtn = detailsContent.querySelector('.copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard?.writeText(node.path || '').then(() => {
        showToast('Path copied');
      }).catch(() => {
        showToast('Copy failed');
      });
    });
  }
  const actionButtons = detailsContent.querySelectorAll('.show-more-btn');
  actionButtons.forEach((btn) => {
    const action = btn.dataset.action;
    if (action === 'show-more' && preview.showMore) {
      btn.addEventListener('click', () => {
        const codeEl = detailsContent.querySelector('.details-json code');
        if (!codeEl) return;
        codeEl.textContent = preview.fullText;
        btn.remove();
      });
    }
    if (action === 'load-chunk' && preview.binary) {
      btn.addEventListener('click', () => {
        const codeEl = detailsContent.querySelector('.details-json code');
        if (!codeEl) return;
        codeEl.textContent = preview.chunk;
        btn.remove();
      });
    }
  });
}

function createDetailValue(node) {
  if (node.type === 'object' || node.type === 'array') {
    const summary = node.type === 'object' ? '{ … }' : '[ … ]';
    return { text: summary, showMore: false };
  }
  if (node.type === 'null') {
    return { text: 'null', showMore: false };
  }
  if (node.isBinary) {
    const raw = typeof node.valueRaw === 'string' ? node.valueRaw : String(node.valueRaw ?? '');
    return {
      text: `<binary ${node.binaryLength} bytes>`,
      showMore: false,
      binary: true,
      chunk: raw.slice(0, 1024),
    };
  }
  const raw = node.valueRaw;
  const json = JSON.stringify(raw, null, 2) ?? '';
  if (json.length > 800) {
    return {
      text: json.slice(0, 800) + '…',
      showMore: true,
      fullText: json,
    };
  }
  return { text: json, showMore: false };
}

function toggleNodeExpansion(nodeId) {
  if (!state.rootNode) return;
  if (state.expanded.has(nodeId)) {
    state.expanded.delete(nodeId);
  } else {
    state.expanded.add(nodeId);
  }
  renderTree(nodeId);
}

function isNodeVisible(nodeId) {
  if (!state.searchTerm) return true;
  if (state.searchVisible.size === 0) return true;
  return state.searchVisible.has(nodeId);
}

function renderTree(preserveFocusId) {
  treeContainer.innerHTML = '';
  state.renderOrder = [];
  if (!state.rootNode) {
    treeContainer.innerHTML = '<p class="empty-details">No data to display.</p>';
    return;
  }
  const root = state.rootNode;
  const fragment = document.createDocumentFragment();
  const nodesToRender = state.rootOnly
    ? (state.expanded.has(root.id) ? ensureChildren(root, true) : [])
    : [root];
  nodesToRender.forEach((node) => {
    const rendered = renderNode(node, 1);
    if (rendered) fragment.appendChild(rendered);
  });
  treeContainer.appendChild(fragment);
  treeContainer.querySelectorAll('[data-node-id]').forEach((el) => {
    el.setAttribute('tabindex', '-1');
    if (!el.hasAttribute('role')) {
      el.setAttribute('role', 'treeitem');
    }
  });
  const focusId = preserveFocusId || state.selectedId || state.focusedId || state.renderOrder[0];
  if (focusId) {
    focusNode(focusId);
  }
  if (state.selectedId) {
    const selectedEl = treeContainer.querySelector(`[data-node-id="${CSS.escape(state.selectedId)}"]`);
    if (selectedEl) {
      selectedEl.setAttribute('aria-selected', 'true');
    }
  }
}

function renderNode(node, depth) {
  if (!isNodeVisible(node.id)) {
    if (!state.searchTerm) return null;
    if (!state.searchVisible.has(node.id)) {
      return null;
    }
  }
  const hasChildren = node.type === 'object' || node.type === 'array';
  const expanded = state.expanded.has(node.id);
  const nodeEl = document.createElement('div');
  nodeEl.className = 'tree-node';
  nodeEl.dataset.nodeId = node.id;
  nodeEl.setAttribute('aria-level', depth);
  if (hasChildren) {
    nodeEl.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }
  const offset = Math.max(0, depth - 1) * 0.75;
  nodeEl.style.marginLeft = `${offset}rem`;

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'node-toggle';
  toggleBtn.setAttribute('aria-label', expanded ? 'Collapse' : 'Expand');
  toggleBtn.innerHTML = hasChildren ? (expanded ? '&#9662;' : '&#9656;') : '';
  if (!hasChildren) {
    toggleBtn.disabled = true;
    toggleBtn.style.visibility = 'hidden';
  }
  nodeEl.appendChild(toggleBtn);

  const label = document.createElement('span');
  label.className = 'node-label';
  const keySpan = document.createElement('span');
  keySpan.className = 'node-key';
  const keyText = node.isRoot ? 'Root' : formatKeyForDisplay(node.key);
  keySpan.innerHTML = highlightText(keyText, state.searchTerm);
  label.appendChild(keySpan);

  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = node.type;
  label.appendChild(badge);

  if (node.type !== 'object' && node.type !== 'array') {
    const preview = document.createElement('span');
    preview.className = 'node-preview';
    preview.textContent = node.isBinary
      ? `<binary ${node.binaryLength} bytes>`
      : truncatePreview(node.valuePreview || '', 120);
    if (state.searchMatches.has(node.id)) {
      preview.classList.add('highlight-match');
    }
    label.appendChild(preview);
  }

  nodeEl.appendChild(label);

  nodeEl.addEventListener('dblclick', () => {
    if (hasChildren) {
      toggleNodeExpansion(node.id);
    }
  });

  state.renderOrder.push(node.id);

  if (hasChildren && expanded) {
    const childrenWrapper = document.createElement('div');
    childrenWrapper.className = 'node-children';
    childrenWrapper.setAttribute('role', 'group');
    const children = ensureChildren(node, !!state.searchTerm);
    let list = children;
    if (state.searchTerm) {
      list = children.filter((child) => isNodeVisible(child.id));
    }
    let renderCount = list.length;
    if (!state.searchTerm && list.length > VIRTUAL_LIMIT) {
      const loaded = node.loadedCount ?? CHUNK_SIZE;
      renderCount = Math.min(loaded, list.length);
      if (!node.loadedCount) {
        node.loadedCount = renderCount;
      }
    }
    for (let i = 0; i < renderCount; i++) {
      const childNode = list[i];
      const childEl = renderNode(childNode, depth + 1);
      if (childEl) {
        childrenWrapper.appendChild(childEl);
      }
    }
    if (!state.searchTerm && list.length > renderCount) {
      const info = document.createElement('div');
      info.className = 'virtual-warning';
      info.textContent = `Showing ${renderCount} of ${list.length} children.`;
      const loadMore = document.createElement('button');
      loadMore.className = 'load-more';
      loadMore.type = 'button';
      loadMore.textContent = 'Load more';
      loadMore.addEventListener('click', () => {
        node.loadedCount = Math.min(list.length, (node.loadedCount ?? renderCount) + CHUNK_SIZE);
        renderTree(node.id);
      });
      childrenWrapper.appendChild(info);
      childrenWrapper.appendChild(loadMore);
    }
    nodeEl.appendChild(childrenWrapper);
  }

  return nodeEl;
}

function formatKeyForDisplay(key) {
  if (key === null || key === undefined || key === '') return '(root)';
  if (typeof key === 'number') return `[${key}]`;
  return String(key);
}

function highlightText(text, term) {
  if (!term) return escapeHtml(text);
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return escapeHtml(text);
  const before = escapeHtml(text.slice(0, idx));
  const match = escapeHtml(text.slice(idx, idx + term.length));
  const after = escapeHtml(text.slice(idx + term.length));
  return `${before}<mark>${match}</mark>${after}`;
}

function truncatePreview(str, max) {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '…';
}

function ensureChildren(node, eager = false) {
  if (node.childrenCache && !eager) {
    return node.childrenCache;
  }
  if (node.childrenCache && eager) {
    return node.childrenCache;
  }
  let children = [];
  if (node.type === 'object') {
    const keys = node.childrenKeys ?? sortObjectKeys(Object.keys(node.valueRef));
    node.childrenKeys = keys;
    children = keys.map((key) => createChildNode(node, key, node.valueRef[key]));
  } else if (node.type === 'array') {
    const arr = node.valueRef;
    const length = Array.isArray(arr) ? arr.length : 0;
    node.size = length;
    children = [];
    for (let i = 0; i < length; i++) {
      children.push(createChildNode(node, i, arr[i]));
    }
  }
  node.childrenCache = children;
  return children;
}

function createChildNode(parent, key, value) {
  const type = detectType(value);
  const path = computePath(parent.path, key);
  const id = path || (parent.id === '$root' ? `${parent.id}:${String(key)}` : `${parent.id}.${String(key)}`);
  const node = {
    id,
    key,
    path,
    parentId: parent.id,
    type,
    isRoot: false,
    size: undefined,
    valueRaw: undefined,
    valuePreview: undefined,
    valueRef: value,
  };
  if (type === 'object') {
    node.valueRef = value || {};
    const keys = sortObjectKeys(Object.keys(node.valueRef));
    node.childrenKeys = keys;
    node.size = keys.length;
  } else if (type === 'array') {
    node.valueRef = Array.isArray(value) ? value : [];
    node.size = node.valueRef.length;
  } else if (type === 'null') {
    node.valueRaw = null;
    node.valuePreview = 'null';
  } else {
    node.valueRaw = value;
    if (type === 'string') {
      if (value != null) {
        const str = String(value);
        if (looksBinary(str)) {
          node.isBinary = true;
          node.binaryLength = str.length;
          node.valuePreview = `<binary ${str.length} bytes>`;
        } else {
          node.valuePreview = str;
        }
      } else {
        node.valuePreview = '';
      }
    } else {
      node.valuePreview = value !== undefined ? String(value) : '';
    }
  }
  if (!node.valuePreview && node.type !== 'object' && node.type !== 'array') {
    node.valuePreview = node.valueRaw === null ? 'null' : JSON.stringify(node.valueRaw);
  }
  state.nodeMap.set(node.id, node);
  return node;
}

function computePath(parentPath, key) {
  if (parentPath === undefined || parentPath === null) parentPath = '';
  if (parentPath === '' && (key === null || key === undefined || key === '')) {
    return '';
  }
  if (typeof key === 'number') {
    return parentPath ? `${parentPath}[${key}]` : `[${key}]`;
  }
  const keyStr = String(key);
  if (!parentPath) {
    return keyStr;
  }
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(keyStr)) {
    return `${parentPath}.${keyStr}`;
  }
  const escaped = keyStr.replace(/"/g, '\\"');
  return `${parentPath}["${escaped}"]`;
}

function detectType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const type = typeof value;
  switch (type) {
    case 'object':
      return 'object';
    case 'string':
      return 'string';
    case 'number':
      return Number.isFinite(value) ? 'number' : 'string';
    case 'boolean':
      return 'boolean';
    default:
      return 'string';
  }
}

function sortObjectKeys(keys) {
  return keys.sort((a, b) => {
    const aNum = /^[0-9]+$/.test(a);
    const bNum = /^[0-9]+$/.test(b);
    if (aNum && bNum) {
      return Number(a) - Number(b);
    }
    if (aNum) return -1;
    if (bNum) return 1;
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  });
}

function looksBinary(str) {
  if (!str) return false;
  let nonPrintable = 0;
  const len = Math.min(str.length, 2048);
  for (let i = 0; i < len; i++) {
    const code = str.charCodeAt(i);
    if (code < 9 || (code > 13 && code < 32)) {
      nonPrintable++;
    }
  }
  return nonPrintable / len > 0.2 || str.length > 20000;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(message, action) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      action.onClick();
      toast.remove();
    });
    toast.appendChild(btn);
  }
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function setSettings(settings, options = {}) {
  state.settings = settings || {};
  state.jsonColumn = state.settings.jsonColumn || null;
  validateConfiguration();
  if (!options.deferParse && state.rows.length > 0 && state.jsonColumn) {
    parseRow(state.currentRowIndex);
  }
}

function setData(rows) {
  state.rows = Array.isArray(rows) ? rows : [];
  state.currentRowIndex = 0;
  state.rowLabels = state.rows.map((row, idx) => {
    const labelKey = Object.keys(row).find((key) => /name|title|label/i.test(key));
    const labelValue = labelKey ? row[labelKey] : undefined;
    return labelValue ? `${idx + 1} · ${labelValue}` : `Row ${idx + 1}`;
  });
  updateRowSelector();
  if (state.jsonColumn && state.rows.length > 0) {
    parseRow(state.currentRowIndex);
  } else {
    resetTree();
  }
}

function selectRow(index) {
  if (!state.rows || index < 0 || index >= state.rows.length) return;
  state.currentRowIndex = index;
  parseRow(index);
}

function updateRowSelector() {
  if (!state.rows || state.rows.length <= 1) {
    rowSelectorContainer.classList.add('hidden');
    rowSelector.innerHTML = '';
    return;
  }
  rowSelectorContainer.classList.remove('hidden');
  rowSelector.innerHTML = '';
  state.rows.forEach((_, idx) => {
    const option = document.createElement('option');
    option.value = String(idx);
    option.textContent = state.rowLabels[idx] || `Row ${idx + 1}`;
    if (idx === state.currentRowIndex) {
      option.selected = true;
    }
    rowSelector.appendChild(option);
  });
}

function validateConfiguration() {
  if (!state.jsonColumn) {
    configNotice.textContent = 'Select the JSON column in the view options to render data.';
    configNotice.hidden = false;
  } else {
    configNotice.hidden = true;
  }
}

function parseRow(index) {
  if (!state.jsonColumn) {
    return;
  }
  const row = state.rows[index];
  if (!row) {
    showError(`Row ${index + 1} is unavailable.`);
    return;
  }
  const raw = row[state.jsonColumn];
  if (raw === undefined || raw === null || raw === '') {
    showError(`Row ${index + 1} has empty JSON.`);
    resetTree();
    return;
  }
  const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
  state.lastRawText = text;
  if (text.length > WORKER_THRESHOLD_BYTES) {
    parseWithWorker(text).catch((err) => {
      handleParseError(err, index, text);
    });
  } else {
    try {
      const json = JSON.parse(text);
      applyParsed(json);
    } catch (err) {
      handleParseError(err, index, text);
    }
  }
}

function parseWithWorker(text) {
  return new Promise((resolve, reject) => {
    try {
      ensureWorker();
      const parseId = ++state.pendingParseId;
      state.parseWorker.onmessage = (event) => {
        const { id, success, payload, error } = event.data || {};
        if (id !== parseId) return;
        if (success) {
          applyParsed(payload);
          resolve(payload);
        } else {
          reject(new Error(error || 'Parse failed'));
        }
      };
      state.parseWorker.onerror = (err) => {
        reject(err);
      };
      state.parseWorker.postMessage({ id: parseId, text });
    } catch (err) {
      reject(err);
    }
  });
}

function ensureWorker() {
  if (!state.parseWorker) {
    state.parseWorker = new Worker('parser.worker.js');
  }
}

function applyParsed(json) {
  clearError();
  buildTreeModel(json);
  collapseAll();
  state.selectedId = null;
  state.searchMatches.clear();
  state.searchVisible.clear();
  if (state.searchTerm) {
    runSearch();
  } else {
    renderTree();
  }
  updateDetails(null);
}

function handleParseError(err, index, text) {
  const message = err?.message || 'Invalid JSON';
  showError(`Failed to parse row ${index + 1}: ${message}`, text);
  showToast('JSON parse failed', {
    label: 'Retry',
    onClick: () => parseRow(index),
  });
  resetTree();
}

function showError(message, sourceText) {
  errorCard.hidden = false;
  errorCard.innerHTML = `<strong>${escapeHtml(message)}</strong>`;
  if (sourceText) {
    errorCard.innerHTML += `<pre>${escapeHtml(sourceText.slice(0, 200))}</pre>`;
  }
}

function clearError() {
  errorCard.hidden = true;
  errorCard.innerHTML = '';
}

function resetTree() {
  state.rootNode = null;
  state.nodeMap.clear();
  treeContainer.innerHTML = '';
  updateDetails(null);
}

function buildTreeModel(value) {
  state.nodeMap.clear();
  let rootValue = value;
  let rootType = detectType(rootValue);
  let isSynthetic = false;
  if (rootType !== 'object' && rootType !== 'array') {
    rootValue = { value: rootValue };
    rootType = 'object';
    isSynthetic = true;
  }
  const rootNode = {
    id: '$root',
    key: '<root>',
    path: '',
    parentId: null,
    type: rootType,
    valueRef: rootValue,
    size: rootType === 'object' ? Object.keys(rootValue).length : rootValue.length,
    isRoot: true,
    synthetic: isSynthetic,
  };
  if (rootType === 'object') {
    rootNode.childrenKeys = sortObjectKeys(Object.keys(rootValue));
  } else if (rootType === 'array') {
    rootNode.size = rootValue.length;
  }
  state.nodeMap.set(rootNode.id, rootNode);
  state.rootNode = rootNode;
}

function setupOmniscopeIntegration() {
  if (!window.omniscope || !omniscope.view || typeof omniscope.view.on !== 'function') {
    return;
  }

  omniscope.view.on('load', () => {
    window.onerror = function handleOmniscopeError(message, source, line, column, error) {
      const text = error?.message || (typeof message === 'string' ? message : 'Unexpected error');
      try {
        omniscope.view.error(text);
      } catch (err) {
        console.error('Failed to report error to Omniscope:', err);
      }
    };
  });

  const handleUpdate = () => {
    try {
      const context = omniscope.view.context();
      const optionItems = context?.options?.items || {};
      const settings = context?.settings || {};
      const jsonOption = optionItems.jsonField ?? optionItems.jsonColumn ?? settings.jsonColumn;
      const labelOption = optionItems.labelField ?? null;
      const jsonFieldName = extractFieldName(jsonOption);

      setSettings({ jsonColumn: jsonFieldName }, { deferParse: true });

      if (!jsonFieldName) {
        setData([]);
        return;
      }

      fetchRowsFromOmniscope(jsonOption, labelOption, context?.dataConfig?.filter).catch((err) => {
        console.error('Failed to load Omniscope data', err);
        showToast('Failed to load data', {
          label: 'Retry',
          onClick: handleUpdate,
        });
        try {
          omniscope.view.error(err?.message || String(err));
        } catch (reportErr) {
          console.error('Unable to report error to Omniscope', reportErr);
        }
      });
    } catch (err) {
      console.error('Error while updating from Omniscope context', err);
      try {
        omniscope.view.error(err?.message || String(err));
      } catch (reportErr) {
        console.error('Unable to report error to Omniscope', reportErr);
      }
    }
  };

  omniscope.view.on(['load', 'update', 'selection', 'filter'], handleUpdate);
  handleUpdate();
}

function extractFieldName(option) {
  if (!option) return null;
  if (typeof option === 'string') return option;
  if (typeof option === 'object') {
    if (typeof option.inputField === 'string') {
      return option.inputField;
    }
    if (typeof option.field === 'string') {
      return option.field;
    }
    if (typeof option.value === 'string') {
      return option.value;
    }
  }
  return null;
}

function buildGrouping(option, name) {
  if (!option) return null;
  const grouping = {
    type: 'UNIQUE_VALUES',
    name,
    fitToScreen: false,
  };
  if (typeof option === 'object') {
    grouping.inputField = option;
    if (option.type) {
      grouping.type = option.type;
    }
  } else {
    grouping.inputField = option;
  }
  return grouping.inputField ? grouping : null;
}

function buildJsonQuery(jsonOption, labelOption, filter) {
  const jsonFieldName = extractFieldName(jsonOption);
  if (!jsonFieldName) return null;
  const groupings = [];
  const labelGrouping = buildGrouping(labelOption, 'rowLabel');
  if (labelGrouping) {
    groupings.push(labelGrouping);
  }
  const jsonGrouping = buildGrouping(jsonOption, 'jsonGroup');
  if (jsonGrouping) {
    groupings.push(jsonGrouping);
  }
  const measures = [
    {
      name: 'jsonValue',
      inputField: jsonFieldName,
      function: 'SINGLETON',
    },
    {
      name: 'rowCount',
      inputField: jsonFieldName,
      function: 'COUNT',
    },
  ];
  return {
    '@visokiotype': 'QueryApi.AggregateOperation',
    groupings,
    measures,
    input: {
      '@visokiotype': 'QueryApi.RecordFilterOperation',
      filter: filter || null,
      input: {
        '@visokiotype': 'QueryApi.DefaultSource',
      },
    },
  };
}

function fetchRowsFromOmniscope(jsonOption, labelOption, filter) {
  const jsonFieldName = extractFieldName(jsonOption);
  if (!jsonFieldName || !window.omniscope || !omniscope.view) {
    return Promise.resolve();
  }
  const query = buildJsonQuery(jsonOption, labelOption, filter);
  if (!query) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const queryId = ++state.pendingQueryId;
    let resolved = false;
    try {
      omniscope.view.busy(true);
      omniscope.view
        .queryBuilder()
        .table(query)
        .on('load', (event) => {
          if (queryId !== state.pendingQueryId) {
            omniscope.view.busy(false);
            resolved = true;
            resolve();
            return;
          }
          try {
            processQueryResult(event?.data, jsonFieldName, Boolean(labelOption));
            omniscope.view.busy(false);
            resolved = true;
            resolve();
          } catch (err) {
            omniscope.view.busy(false);
            reject(err);
          }
        })
        .on('error', (err) => {
          if (queryId !== state.pendingQueryId) {
            return;
          }
          if (!resolved) {
            omniscope.view.busy(false);
            reject(err?.error ? new Error(err.error) : err);
          }
        })
        .execute();
    } catch (err) {
      omniscope.view.busy(false);
      reject(err);
    }
  });
}

function getMappingIndex(mappings, key) {
  if (!mappings) return undefined;
  if (Object.prototype.hasOwnProperty.call(mappings, key)) {
    return mappings[key];
  }
  return undefined;
}

function processQueryResult(result, jsonFieldName, hasExplicitLabel) {
  if (!result) {
    clearError();
    setData([]);
    return;
  }
  const records = Array.isArray(result.records) ? result.records : [];
  const mappings = result.mappings || {};
  const jsonIdx = getMappingIndex(mappings, 'jsonValue');
  const labelIdx = getMappingIndex(mappings, 'rowLabel');
  const jsonGroupIdx = getMappingIndex(mappings, 'jsonGroup');
  const countIdx = getMappingIndex(mappings, 'rowCount');
  const rows = [];

  records.forEach((record, recordIdx) => {
    if (!Array.isArray(record)) return;
    const jsonText = jsonIdx != null ? record[jsonIdx] : record[record.length - 1];
    let baseLabel = null;
    if (labelIdx != null) {
      baseLabel = record[labelIdx];
    } else if (hasExplicitLabel && jsonGroupIdx != null) {
      baseLabel = record[jsonGroupIdx];
    } else if (!hasExplicitLabel) {
      baseLabel = jsonGroupIdx != null ? record[jsonGroupIdx] : `Row ${recordIdx + 1}`;
    }
    let copies = countIdx != null ? Number(record[countIdx]) || 1 : 1;
    if (!Number.isFinite(copies) || copies < 1) copies = 1;
    for (let i = 0; i < copies; i++) {
      const row = { [jsonFieldName]: jsonText };
      if (baseLabel != null && baseLabel !== '') {
        row.__label = baseLabel;
      }
      rows.push(row);
    }
  });

  if (rows.length === 0) {
    clearError();
    setData([]);
  } else {
    clearError();
    setData(rows);
  }
}

function onExternalSelectRow(index) {
  if (typeof index === 'number') {
    selectRow(index);
    if (rowSelector.options.length) {
      rowSelector.value = String(index);
    }
  }
}

window.viewApi = {
  setData,
  setSettings,
  selectRow: onExternalSelectRow,
};

init();
setupOmniscopeIntegration();

// Sample data for local testing if running standalone
if (!window.omniscope) {
  const sample = {
    orderId: 'A-1001',
    customer: { id: 42, name: 'Ada Lovelace' },
    items: [
      { sku: 'P-1', qty: 2, price: 9.99, attrs: { color: 'red', size: 'M' } },
      { sku: 'P-2', qty: 1, price: 14.5 },
    ],
    shipped: false,
    notes: 'Gift wrap\nand deliver before Friday.',
    metrics: { weights: [1, 2, 3, 4, 5], durations: { pack: 12, ship: 48 } },
  };
  setSettings({ jsonColumn: 'payload' });
  setData([{ payload: JSON.stringify(sample) }]);
}
