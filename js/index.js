/* =============================================================
   To-Do Life Dashboard — js/index.js
   Modules: StorageService, ThemeModule, GreetingModule,
            TimerModule, TodoModule, LinksModule, App
   ============================================================= */

// ─── StorageService ───────────────────────────────────────────
function probeStorage() {
  try {
    const k = '__tld_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch (e) { return false; }
}

const StorageService = {
  isAvailable: false,

  get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) { return false; }
  },

  remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }
};

StorageService.isAvailable = probeStorage();

// ─── ThemeModule ──────────────────────────────────────────────
// Manages light / dark mode. Persists preference to localStorage.
const ThemeModule = {
  _STORAGE_KEY: 'tld_theme',
  _current: 'dark',
  _toggleBtn: null,

  /** Apply theme to <html> element and update button label. */
  _apply(theme) {
    this._current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (this._toggleBtn) {
      this._toggleBtn.textContent = theme === 'dark' ? '☀ Light' : '☾ Dark';
      this._toggleBtn.setAttribute('aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  },

  toggle() {
    const next = this._current === 'dark' ? 'light' : 'dark';
    this._apply(next);
    StorageService.set(this._STORAGE_KEY, next);
  },

  init(toggleBtn) {
    this._toggleBtn = toggleBtn;
    const saved = StorageService.get(this._STORAGE_KEY);
    // Also respect OS preference when no saved preference exists
    const prefersDark = window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');
    this._apply(initial);
    toggleBtn.addEventListener('click', () => this.toggle());
  }
};

// ─── Pure helpers — Greeting ──────────────────────────────────
function _getGreeting(hour) {
  if (hour >= 21 || hour <= 4) return 'Good Night';
  if (hour >= 18)              return 'Good Evening';
  if (hour >= 11)              return 'Good Afternoon';
  return 'Good Morning';
}

function _formatTime(date) {
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map(n => String(n).padStart(2, '0'))
    .join(':');
}

function _formatDate(date) {
  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  return `${DAYS[date.getDay()]}, ${String(date.getDate()).padStart(2,'0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// ─── GreetingModule ───────────────────────────────────────────
// Adds custom name support: stored in localStorage under 'tld_name'.
const GreetingModule = {
  _STORAGE_KEY: 'tld_name',
  _timeEl:      null,
  _dateEl:      null,
  _greetingEl:  null,
  _nameInput:   null,
  _intervalId:  null,

  _tick() {
    const now = new Date();
    if (isNaN(now.getTime())) {
      if (this._timeEl)    this._timeEl.textContent    = '--:--:--';
      if (this._dateEl)    this._dateEl.textContent    = '--';
      if (this._greetingEl) this._greetingEl.textContent = '--';
      return;
    }
    if (this._timeEl)    this._timeEl.textContent    = _formatTime(now);
    if (this._dateEl)    this._dateEl.textContent    = _formatDate(now);
    if (this._greetingEl) {
      const name = (this._nameInput && this._nameInput.value.trim()) || '';
      const base = _getGreeting(now.getHours());
      this._greetingEl.textContent = name ? `${base}, ${name}!` : `${base}!`;
    }
  },

  _saveName() {
    const name = this._nameInput ? this._nameInput.value.trim() : '';
    StorageService.set(this._STORAGE_KEY, name);
    this._tick(); // refresh greeting immediately
  },

  init(container) {
    const savedName = StorageService.get(this._STORAGE_KEY) || '';

    container.innerHTML =
      '<div class="greeting-name-row">' +
        '<input class="greeting-name-input" type="text" maxlength="40" ' +
               'placeholder="Your name" aria-label="Your name" />' +
        '<span class="greeting-name-hint label-secondary">press Enter to save</span>' +
      '</div>' +
      '<div class="time-display" aria-live="polite"></div>' +
      '<div class="date-display"></div>' +
      '<div class="greeting-text"></div>';

    this._timeEl     = container.querySelector('.time-display');
    this._dateEl     = container.querySelector('.date-display');
    this._greetingEl = container.querySelector('.greeting-text');
    this._nameInput  = container.querySelector('.greeting-name-input');

    this._nameInput.value = savedName;

    // Save on Enter or blur
    this._nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { this._nameInput.blur(); }
    });
    this._nameInput.addEventListener('blur', () => this._saveName());
    // Live preview while typing
    this._nameInput.addEventListener('input', () => this._tick());

    this._tick();
    this._intervalId = setInterval(() => this._tick(), 1000);
  }
};

// ─── Pure helpers — Timer ─────────────────────────────────────
function _formatDisplay(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function _updateTitle(seconds, isRunning) {
  document.title = isRunning
    ? _formatDisplay(seconds) + ' \u2014 Focus'
    : 'To-Do Life Dashboard';
}

// ─── TimerModule ──────────────────────────────────────────────
const TimerModule = {
  _INITIAL: 1500,
  _intervalId: null,
  state: { remaining: 1500, isRunning: false, isComplete: false },
  _displayEl: null, _statusEl: null,
  _startBtn: null, _stopBtn: null, _resetBtn: null,

  _render() {
    if (this._displayEl) this._displayEl.textContent = _formatDisplay(this.state.remaining);
    _updateTitle(this.state.remaining, this.state.isRunning);
    if (this._statusEl)  this._statusEl.textContent  = this.state.isComplete ? 'Session Complete ✓' : '';
    if (this._startBtn)  this._startBtn.disabled     = this.state.isRunning;
  },

  _start() {
    if (this.state.isRunning) return;
    this.state.isRunning = true;
    this._intervalId = setInterval(() => this._tick(), 1000);
    this._render();
  },

  _stop() {
    clearInterval(this._intervalId); this._intervalId = null;
    this.state.isRunning = false;
    _updateTitle(this.state.remaining, false);
    this._render();
  },

  _reset() {
    clearInterval(this._intervalId); this._intervalId = null;
    this.state = { remaining: this._INITIAL, isRunning: false, isComplete: false };
    _updateTitle(this._INITIAL, false);
    this._render();
  },

  _tick() {
    this.state.remaining -= 1;
    if (this.state.remaining <= 0) {
      this.state.remaining = 0;
      clearInterval(this._intervalId); this._intervalId = null;
      this.state.isRunning = false;
      this.state.isComplete = true;
      _updateTitle(0, false);
    }
    this._render();
  },

  init(container) {
    container.innerHTML =
      '<h2 class="widget-title">Focus Timer</h2>' +
      '<div class="timer-display" role="timer" aria-live="polite">25:00</div>' +
      '<div class="timer-status" aria-live="polite"></div>' +
      '<div class="timer-controls">' +
        '<button class="btn-primary  timer-btn-start" type="button">▶ Start</button>' +
        '<button class="btn-secondary timer-btn-stop"  type="button">⏸ Stop</button>' +
        '<button class="btn-secondary timer-btn-reset" type="button">↺ Reset</button>' +
      '</div>';

    this._displayEl = container.querySelector('.timer-display');
    this._statusEl  = container.querySelector('.timer-status');
    this._startBtn  = container.querySelector('.timer-btn-start');
    this._stopBtn   = container.querySelector('.timer-btn-stop');
    this._resetBtn  = container.querySelector('.timer-btn-reset');

    this._startBtn.addEventListener('click', () => this._start());
    this._stopBtn.addEventListener('click',  () => this._stop());
    this._resetBtn.addEventListener('click', () => this._reset());
    this._render();
  }
};

// ─── Pure helpers — Todo ──────────────────────────────────────
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function clearCompleted(tasks) {
  return tasks.filter(t => !t.completed);
}

// ─── TodoModule ───────────────────────────────────────────────
const TodoModule = {
  state: { tasks: [], editingId: null },
  _container: null,

  _load() {
    const saved = StorageService.get('tld_tasks');
    this.state.tasks = Array.isArray(saved) ? saved : [];
  },

  _persist() {
    return StorageService.set('tld_tasks', this.state.tasks);
  },

  /** Returns true if a task with the same description (case-insensitive) already exists. */
  _isDuplicate(description, excludeId) {
    const norm = description.trim().toLowerCase();
    return this.state.tasks.some(t =>
      t.id !== excludeId && t.description.trim().toLowerCase() === norm
    );
  },

  _addTask(description) {
    const trimmed = (description || '').trim();
    const input = this._container ? this._container.querySelector('.todo-input') : null;

    if (trimmed.length === 0) {
      if (input) input.focus();
      return;
    }

    // Duplicate check
    if (this._isDuplicate(trimmed)) {
      this._showInputError('Task already exists.');
      if (input) input.focus();
      return;
    }

    this._clearInputError();
    this.state.tasks.push({
      id: generateId(), description: trimmed, completed: false, createdAt: Date.now()
    });
    this._persist();
    this._render();

    if (input) { input.value = ''; input.focus(); }
  },

  _deleteTask(id) {
    this.state.tasks = this.state.tasks.filter(t => t.id !== id);
    const saved = this._persist();
    this._render();
    if (!saved) this._showListError('Could not save \u2014 deletion may reappear on reload.');
  },

  _toggleTask(id) {
    const task = this.state.tasks.find(t => t.id === id);
    if (task) task.completed = !task.completed;
    this._persist();
    this._render();
  },

  _clearCompleted() {
    this.state.tasks = this.state.tasks.filter(t => !t.completed);
    this._persist();
    this._render();
  },

  _beginEdit(id) {
    this.state.editingId = id;
    this._render();
    const el = this._container ? this._container.querySelector('.task-edit-input') : null;
    if (el) el.focus();
  },

  _commitEdit(id, newText) {
    const trimmed = (newText || '').trim();
    if (trimmed.length === 0) { this._cancelEdit(id); return; }

    // Duplicate check (exclude the task being edited)
    if (this._isDuplicate(trimmed, id)) {
      // Show inline error on the edit input
      const editInput = this._container ? this._container.querySelector('.task-edit-input') : null;
      if (editInput) {
        editInput.classList.add('input-error');
        let errEl = editInput.parentElement.querySelector('.edit-dup-error');
        if (!errEl) {
          errEl = document.createElement('span');
          errEl.className = 'duplicate-warning edit-dup-error';
          editInput.parentElement.appendChild(errEl);
        }
        errEl.textContent = 'Task already exists.';
        editInput.focus();
      }
      return;
    }

    const task = this.state.tasks.find(t => t.id === id);
    if (task) task.description = trimmed;
    this.state.editingId = null;
    this._persist();
    this._render();
  },

  _cancelEdit() {
    this.state.editingId = null;
    this._render();
  },

  _showInputError(msg) {
    if (!this._container) return;
    let el = this._container.querySelector('.todo-input-error');
    if (!el) {
      el = document.createElement('p');
      el.className = 'duplicate-warning todo-input-error';
      const row = this._container.querySelector('.todo-input-row');
      if (row) row.insertAdjacentElement('afterend', el);
    }
    el.textContent = msg;
  },

  _clearInputError() {
    if (!this._container) return;
    const el = this._container.querySelector('.todo-input-error');
    if (el) el.remove();
  },

  _showListError(msg) {
    if (!this._container) return;
    const el = document.createElement('p');
    el.className = 'error-message';
    el.textContent = msg;
    const list = this._container.querySelector('.todo-list');
    if (list) list.insertAdjacentElement('afterend', el);
    else this._container.appendChild(el);
  },

  _render() {
    if (!this._container) return;

    const list = this._container.querySelector('.todo-list');
    const clearBtn = this._container.querySelector('.todo-clear-btn');
    if (!list) return;

    const hasCompleted = this.state.tasks.some(t => t.completed);
    if (clearBtn) clearBtn.disabled = !hasCompleted;

    if (this.state.tasks.length === 0) {
      list.innerHTML = '<li><p class="placeholder-text">No tasks yet. Add one above!</p></li>';
      return;
    }

    list.innerHTML = '';
    this.state.tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.completed ? ' completed' : '');

      if (this.state.editingId === task.id) {
        // Edit mode
        li.innerHTML =
          '<input class="task-edit-input" type="text" value="" />' +
          '<div class="task-actions">' +
            '<button class="btn-primary btn-save-edit" type="button">Save</button>' +
            '<button class="btn-secondary btn-cancel-edit" type="button">Cancel</button>' +
          '</div>';
        const editInput = li.querySelector('.task-edit-input');
        editInput.value = task.description;

        li.querySelector('.btn-save-edit').addEventListener('click', () =>
          this._commitEdit(task.id, editInput.value));
        li.querySelector('.btn-cancel-edit').addEventListener('click', () =>
          this._cancelEdit());
        editInput.addEventListener('keydown', e => {
          if (e.key === 'Enter')  this._commitEdit(task.id, editInput.value);
          if (e.key === 'Escape') this._cancelEdit();
        });
      } else {
        // View mode
        li.innerHTML =
          '<input type="checkbox" aria-label="Mark complete" />' +
          '<span class="task-description"></span>' +
          '<div class="task-actions">' +
            '<button class="btn-icon btn-edit-task" type="button" title="Edit">✏</button>' +
            '<button class="btn-danger btn-delete-task" type="button" title="Delete">✕</button>' +
          '</div>';

        li.querySelector('input[type="checkbox"]').checked = task.completed;
        li.querySelector('.task-description').textContent = task.description;

        li.querySelector('input[type="checkbox"]').addEventListener('change', () =>
          this._toggleTask(task.id));
        li.querySelector('.btn-edit-task').addEventListener('click', () =>
          this._beginEdit(task.id));
        li.querySelector('.btn-delete-task').addEventListener('click', () =>
          this._deleteTask(task.id));
      }

      list.appendChild(li);
    });
  },

  init(container) {
    this._container = container;
    container.innerHTML =
      '<h2 class="widget-title">To-Do List</h2>' +
      '<div class="todo-input-row">' +
        '<input class="todo-input" type="text" placeholder="Add a task…" aria-label="New task" />' +
        '<button class="btn-primary todo-add-btn" type="button">Add</button>' +
      '</div>' +
      '<ul class="todo-list" aria-label="Task list"></ul>' +
      '<div class="todo-actions">' +
        '<button class="btn-secondary todo-clear-btn" type="button" disabled>Clear Completed</button>' +
      '</div>';

    const input   = container.querySelector('.todo-input');
    const addBtn  = container.querySelector('.todo-add-btn');
    const clearBtn = container.querySelector('.todo-clear-btn');

    addBtn.addEventListener('click', () => this._addTask(input.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') this._addTask(input.value);
    });
    clearBtn.addEventListener('click', () => this._clearCompleted());

    this._load();
    this._render();
  }
};

// ─── Pure helpers — Links ─────────────────────────────────────
function _normalizeUrl(url) {
  const t = url.trim();
  return /^https?:\/\//i.test(t) ? t : 'https://' + t;
}

function _isValidUrl(url) {
  return /^https?:\/\/.+/i.test(url);
}

// ─── LinksModule ──────────────────────────────────────────────
const LinksModule = {
  state: { links: [] },
  _container: null,

  _load() {
    const saved = StorageService.get('tld_links');
    this.state.links = Array.isArray(saved) ? saved : [];
  },

  _persist() {
    return StorageService.set('tld_links', this.state.links);
  },

  _addLink(label, url) {
    const trimLabel = (label || '').trim();
    const normUrl   = _normalizeUrl(url || '');
    const errors    = {};

    if (!trimLabel)           errors.label = 'Label is required.';
    if (trimLabel.length > 100) errors.label = 'Label must be ≤ 100 characters.';
    if (!url.trim())          errors.url   = 'URL is required.';
    if (normUrl.length > 2048) errors.url  = 'URL must be ≤ 2048 characters.';
    if (!errors.url && !_isValidUrl(normUrl)) errors.url = 'Enter a valid URL (e.g. example.com).';

    if (errors.label || errors.url) {
      this._showFormErrors(errors);
      return;
    }

    this._clearFormErrors();
    this.state.links.push({
      id: generateId(), label: trimLabel, url: normUrl, createdAt: Date.now()
    });
    this._persist();
    this._render();

    // Clear inputs
    const lInput = this._container && this._container.querySelector('.link-label-input');
    const uInput = this._container && this._container.querySelector('.link-url-input');
    if (lInput) lInput.value = '';
    if (uInput) uInput.value = '';
  },

  _deleteLink(id) {
    this.state.links = this.state.links.filter(l => l.id !== id);
    this._persist();
    this._render();
  },

  _openLink(id) {
    const link = this.state.links.find(l => l.id === id);
    if (!link) return;

    if (!_isValidUrl(link.url)) {
      this._setLinkError(id, 'Invalid URL — cannot open.');
      return;
    }

    const win = window.open(link.url, '_blank', 'noopener,noreferrer');
    if (win === null) {
      this._setLinkError(id, 'Popup blocked — please allow popups for this page.');
    } else {
      this._clearLinkError(id);
    }
  },

  _setLinkError(id, msg) {
    if (!this._container) return;
    const item = this._container.querySelector(`[data-link-id="${id}"]`);
    if (!item) return;
    let el = item.querySelector('.link-error');
    if (!el) {
      el = document.createElement('p');
      el.className = 'link-error';
      item.appendChild(el);
    }
    el.textContent = msg;
  },

  _clearLinkError(id) {
    if (!this._container) return;
    const item = this._container.querySelector(`[data-link-id="${id}"]`);
    if (!item) return;
    const el = item.querySelector('.link-error');
    if (el) el.remove();
  },

  _showFormErrors(errors) {
    if (!this._container) return;
    const lErr = this._container.querySelector('.link-label-error');
    const uErr = this._container.querySelector('.link-url-error');
    if (lErr) lErr.textContent = errors.label || '';
    if (uErr) uErr.textContent = errors.url   || '';
  },

  _clearFormErrors() {
    if (!this._container) return;
    const lErr = this._container.querySelector('.link-label-error');
    const uErr = this._container.querySelector('.link-url-error');
    if (lErr) lErr.textContent = '';
    if (uErr) uErr.textContent = '';
  },

  _render() {
    if (!this._container) return;
    const list = this._container.querySelector('.links-list');
    if (!list) return;

    if (this.state.links.length === 0) {
      list.innerHTML = '<li><p class="placeholder-text">No links yet. Add one above!</p></li>';
      return;
    }

    list.innerHTML = '';
    this.state.links.forEach(link => {
      const li = document.createElement('li');
      li.className = 'link-item';
      li.dataset.linkId = link.id;

      li.innerHTML =
        '<button class="link-open-btn" type="button">' +
          '<span class="link-label"></span>' +
        '</button>' +
        '<button class="btn-danger btn-delete-link" type="button" title="Delete link">✕</button>';

      li.querySelector('.link-label').textContent = link.label;
      li.querySelector('.link-open-btn').addEventListener('click', () => this._openLink(link.id));
      li.querySelector('.btn-delete-link').addEventListener('click', () => this._deleteLink(link.id));

      list.appendChild(li);
    });
  },

  init(container) {
    this._container = container;
    container.innerHTML =
      '<h2 class="widget-title">Quick Links</h2>' +
      '<div class="links-add-form">' +
        '<input class="link-label-input" type="text"  placeholder="Label (e.g. GitHub)" aria-label="Link label" maxlength="100" />' +
        '<p class="error-message link-label-error"></p>' +
        '<input class="link-url-input"   type="url"   placeholder="URL (e.g. github.com)"  aria-label="Link URL" />' +
        '<p class="error-message link-url-error"></p>' +
        '<button class="btn-primary links-add-btn" type="button">Add Link</button>' +
      '</div>' +
      '<ul class="links-list" aria-label="Quick links"></ul>';

    const addBtn = container.querySelector('.links-add-btn');
    addBtn.addEventListener('click', () => {
      const l = container.querySelector('.link-label-input').value;
      const u = container.querySelector('.link-url-input').value;
      this._addLink(l, u);
    });

    // Allow Enter in URL field to submit
    container.querySelector('.link-url-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const l = container.querySelector('.link-label-input').value;
        this._addLink(l, e.target.value);
      }
    });

    this._load();
    this._render();
  }
};

// ─── App coordinator ──────────────────────────────────────────
const App = {
  init() {
    // Show storage banner if unavailable
    if (!StorageService.isAvailable) {
      const banner = document.getElementById('app-banner');
      if (banner) {
        banner.textContent =
          '⚠ Local Storage is unavailable. Your data will not be saved this session.';
        banner.style.display = 'block';
      }
    }

    // Theme
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) ThemeModule.init(themeBtn);

    // Widgets
    const greetingEl = document.getElementById('greeting-widget');
    const timerEl    = document.getElementById('timer-widget');
    const todoEl     = document.getElementById('todo-widget');
    const linksEl    = document.getElementById('links-widget');

    if (greetingEl) GreetingModule.init(greetingEl);
    if (timerEl)    TimerModule.init(timerEl);
    if (todoEl)     TodoModule.init(todoEl);
    if (linksEl)    LinksModule.init(linksEl);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
