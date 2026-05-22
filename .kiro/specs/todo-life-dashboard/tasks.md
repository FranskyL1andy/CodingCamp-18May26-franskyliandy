# Implementation Plan: To-Do List Life Dashboard

## Overview

Build a single-file (`index.html`) client-side web application using plain HTML, CSS, and vanilla JavaScript. The implementation follows the Module Pattern: each widget is an isolated JavaScript module with its own state, DOM subtree, and localStorage I/O. A thin `App` coordinator bootstraps all modules. A separate `tests.html` file houses all property-based and unit tests using a local copy of fast-check.

## Tasks

- [x] 1. Set up project skeleton and StorageService
  - [x] 1.1 Create `index.html` with full document structure
    - Add `<head>` with charset, viewport meta, and empty `<style>` block
    - Add `<body>` with `#app-banner`, `#app-grid`, and the four widget containers (`#greeting-widget`, `#timer-widget`, `#todo-widget`, `#links-widget`)
    - Add `<script>` block at end of body with `App.init()` wired to `DOMContentLoaded`
    - _Requirements: 10.2, 10.3_

  - [x] 1.2 Implement `StorageService` inside the `<script>` block
    - Implement `probeStorage()` using try/catch setItem/removeItem
    - Implement `StorageService.get(key)` — JSON.parse with SyntaxError and DOMException catch, returns `null` on any error
    - Implement `StorageService.set(key, value)` — JSON.stringify + setItem, returns `false` on DOMException
    - Implement `StorageService.remove(key)`
    - Set `StorageService.isAvailable` flag at startup; show `#app-banner` with `role="alert"` if unavailable
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 1.3 Write property test for task storage round-trip (Property 8)
    - **Property 8: Storage round-trip preserves task data**
    - **Validates: Requirements 3.5, 3.6, 8.1, 8.3**

  - [ ]* 1.4 Write property test for link storage round-trip (Property 18)
    - **Property 18: Storage round-trip preserves link data**
    - **Validates: Requirements 8.2, 8.3**

- [x] 2. Implement CSS layout and visual design
  - [x] 2.1 Write all CSS inside the `<style>` block
    - Define CSS custom properties for colours, spacing, and font sizes
    - Implement mobile-first single-column `#app-grid` with `gap: 16px` and `padding: 16px`
    - Add `@media (min-width: 768px)` breakpoint: two-column grid, greeting and timer span full width
    - Add `@media (min-width: 1280px)` breakpoint: `max-width: 1200px`, centred, `padding: 32px`
    - Ensure minimum body font size 14 px, secondary labels 12 px
    - Ensure WCAG 2.1 AA colour contrast (≥ 4.5:1 for normal text, ≥ 3:1 for large text)
    - Style `#app-banner` as a persistent top banner (hidden by default via `display: none`)
    - Ensure no horizontal overflow or element overlap from 320 px to 2560 px viewport widths
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 3. Implement GreetingModule
  - [x] 3.1 Implement pure helper functions: `_getGreeting(hour)`, `_formatTime(date)`, `_formatDate(date)`
    - `_getGreeting`: check Night first (hour ≥ 21 || hour ≤ 4), then Evening (≥ 18), then Afternoon (≥ 11), else Morning (hours 5–10)
    - `_formatTime`: return `HH:MM:SS` with zero-padded values
    - `_formatDate`: return `"Weekday, DD Month YYYY"` using locale-independent arrays
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 3.2 Write property test for time format correctness (Property 1)
    - **Property 1: Time format correctness**
    - **Validates: Requirements 1.1**

  - [ ]* 3.3 Write property test for date format correctness (Property 2)
    - **Property 2: Date format correctness**
    - **Validates: Requirements 1.2**

  - [ ]* 3.4 Write property test for greeting boundary correctness (Property 3)
    - **Property 3: Greeting boundary correctness**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

  - [x] 3.5 Implement `GreetingModule.init(container)` and `_tick()`
    - Bind DOM refs for `.time-display`, `.date-display`, `.greeting-text`
    - In `_tick()`: call `new Date()`, guard with `isNaN(now.getTime())` — show `--:--:--` placeholder if invalid; do not resume live updates until clock is valid again
    - Start `setInterval(_tick, 1000)` and call `_tick()` immediately so the display is populated before the first second elapses
    - _Requirements: 1.1, 1.2, 1.7, 1.8_

- [x] 4. Implement TimerModule
  - [x] 4.1 Implement pure helpers: `_formatDisplay(totalSeconds)` and `_updateTitle(seconds, isRunning)`
    - `_formatDisplay`: zero-padded `MM:SS` from total seconds
    - `_updateTitle`: set `document.title` to `"MM:SS — Focus"` while running; restore app name when stopped, reset, or complete
    - _Requirements: 2.3, 2.7, 2.8, 2.9_

  - [ ]* 4.2 Write property test for timer format round-trip (Property 5)
    - **Property 5: Timer format round-trip**
    - **Validates: Requirements 2.3**

  - [x] 4.3 Implement `TimerModule.init(container)`, `_start()`, `_stop()`, `_reset()`, and `_tick()`
    - Initialise `state = { remaining: 1500, isRunning: false, isComplete: false }`
    - `_start()`: guard against already-running; start `setInterval(_tick, 1000)`; disable Start button
    - `_stop()`: clear interval; set `isRunning = false`; restore tab title to app name
    - `_reset()`: clear interval; reset state to initial; restore tab title to app name; clear "Session Complete" label
    - `_tick()`: decrement `remaining`; if `remaining <= 0` stop, set `isComplete = true`, show "Session Complete", restore tab title
    - Add `role="timer"` and `aria-live="polite"` to `.timer-display`
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [ ]* 4.4 Write property test for timer tick decrements remaining (Property 4)
    - **Property 4: Timer tick decrements remaining by one**
    - **Validates: Requirements 2.2**

- [~] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement TodoModule — core CRUD
  - [x] 6.1 Implement `TodoModule._load()`, `_persist()`, and `generateId()`
    - `_load()`: call `StorageService.get('tld_tasks')`; treat `null` as `[]`
    - `_persist()`: call `StorageService.set('tld_tasks', state.tasks)`
    - `generateId()`: use `crypto.randomUUID()` with `Date.now().toString(36) + Math.random().toString(36).slice(2)` fallback
    - _Requirements: 3.5, 3.6, 8.1, 8.3, 8.4_

  - [x] 6.2 Implement `_addTask(description)` and `_deleteTask(id)`
    - `_addTask`: trim input; reject if empty/whitespace-only and retain focus on input field; push new Task object with `completed: false`; call `_persist()` then `_render()`; clear input field on success
    - `_deleteTask`: filter out by id; call `_persist()` — if `set` returns `false`, remove from visible list but show inline error "Could not save — deletion may reappear on reload"
    - _Requirements: 3.2, 3.3, 5.1, 5.2, 5.6_

  - [ ]* 6.3 Write property test for adding a task grows list and preserves order (Property 6)
    - **Property 6: Adding a task grows the list and preserves insertion order**
    - **Validates: Requirements 3.2, 3.4**

  - [ ]* 6.4 Write property test for whitespace input rejected (Property 7)
    - **Property 7: Whitespace-only input is rejected for both task creation and task editing**
    - **Validates: Requirements 3.3, 4.3**

  - [ ]* 6.5 Write property test for deletion removes exactly the targeted item (Property 11)
    - **Property 11: Deletion removes exactly the targeted item**
    - **Validates: Requirements 5.2, 7.4**

  - [-] 6.6 Implement `_toggleTask(id)` and `_clearCompleted()`
    - `_toggleTask`: flip `completed` on the matching task; call `_persist()` then `_render()`
    - `_clearCompleted`: filter out all tasks where `completed === true`; call `_persist()` then `_render()`
    - _Requirements: 4.5, 4.6, 5.3, 5.4, 5.5_

  - [ ]* 6.7 Write property test for task toggle is involution (Property 10)
    - **Property 10: Task toggle is an involution**
    - **Validates: Requirements 4.5**

  - [ ]* 6.8 Write property test for clear completed correctness (Property 12)
    - **Property 12: Clear completed removes only completed tasks**
    - **Validates: Requirements 5.4**

- [ ] 7. Implement TodoModule — edit mode and rendering
  - [-] 7.1 Implement `_beginEdit(id)`, `_commitEdit(id, newText)`, and `_cancelEdit(id)`
    - `_beginEdit`: set `state.editingId = id`; call `_render()`; programmatically `focus()` the edit input (setting `editingId` implicitly replaces any prior edit, ensuring only one task is in edit mode)
    - `_commitEdit`: trim `newText`; if empty/whitespace-only, call `_cancelEdit` to restore original description; else update description, clear `editingId`, `_persist()`, `_render()`
    - `_cancelEdit`: clear `editingId`; call `_render()` to restore original description
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 7.2 Write property test for only one task in edit mode (Property 9)
    - **Property 9: Only one task is in edit mode at a time**
    - **Validates: Requirements 4.1**

  - [~] 7.3 Implement `TodoModule._render()` and `TodoModule.init(container)`
    - `_render()`: full DOM replacement of `.todo-list`; render each task with checkbox, description (strikethrough if `completed`), Edit button, Delete button; render edit input pre-filled with current description when `editingId` matches; disable "Clear Completed" button when no completed tasks exist
    - Bind keyboard events: Enter to submit add-input or commit edit; Escape to cancel edit
    - Use event delegation on the module root element
    - `init(container)`: bind DOM refs, call `_load()`, call `_render()`
    - _Requirements: 3.1, 3.2, 3.4, 4.1, 4.4, 5.3, 5.5_

- [ ] 8. Implement LinksModule
  - [x] 8.1 Implement pure helpers: `_normalizeUrl(url)` and `_isValidUrl(url)`
    - `_normalizeUrl`: trim input; prepend `https://` if not already starting with `http://` or `https://` (case-insensitive)
    - `_isValidUrl`: return `true` only if matches `^https?:\/\/.+` (scheme + non-empty host)
    - _Requirements: 7.5, 7.6_

  - [ ]* 8.2 Write property test for URL normalisation idempotence (Property 15)
    - **Property 15: URL normalisation idempotence**
    - **Validates: Requirements 7.5**

  - [ ]* 8.3 Write property test for URL normalisation preserves existing schemes (Property 16)
    - **Property 16: URL normalisation preserves existing schemes**
    - **Validates: Requirements 7.5**

  - [ ]* 8.4 Write property test for valid URL consistency through normalisation (Property 17)
    - **Property 17: Valid URL consistency through normalisation**
    - **Validates: Requirements 7.6**

  - [ ] 8.5 Implement `_addLink(label, url)`, `_deleteLink(id)`, and `_openLink(id)`
    - `_addLink`: validate label (non-empty, ≤ 100 chars) and URL (non-empty, ≤ 2048 chars after normalisation); normalise URL; validate with `_isValidUrl`; show per-field inline errors indicating which field(s) are invalid on rejection; push Link object; `_persist()`, `_render()`
    - `_deleteLink`: filter out by id; `_persist()`, `_render()`
    - `_openLink`: call `window.open(url, '_blank')`; if result is `null` (popup blocked) or URL fails `_isValidUrl`, show inline per-link error that persists until re-activation or explicit dismissal
    - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 8.6 Write property test for adding a link grows the list (Property 13)
    - **Property 13: Adding a link grows the list**
    - **Validates: Requirements 7.2**

  - [ ]* 8.7 Write property test for link validation rejects out-of-bounds inputs (Property 14)
    - **Property 14: Link validation rejects out-of-bounds inputs**
    - **Validates: Requirements 7.3**

  - [~] 8.8 Implement `LinksModule._render()` and `LinksModule.init(container)`
    - `_render()`: full DOM replacement of `.links-list`; render each link as a labelled button with Delete control; apply CSS `text-overflow: ellipsis` for labels > 50 chars (no JS truncation — full label stored in data model); show placeholder message prompting the user to add a link when list is empty
    - `init(container)`: bind DOM refs, call `_load()`, call `_render()`
    - _Requirements: 6.1, 6.4, 6.5_

- [~] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Wire up App coordinator and create tests.html
  - [~] 10.1 Implement `App.init()` and wire all modules
    - Call `StorageService` probe; show `#app-banner` if unavailable
    - Call `GreetingModule.init()`, `TimerModule.init()`, `TodoModule.init()`, `LinksModule.init()` in DOM order
    - Ensure all cross-module concerns (tab title management) are handled within their respective modules
    - Verify the app renders and restores all saved data without any network requests (offline-first)
    - _Requirements: 8.5, 8.6, 9.5, 10.1_

  - [~] 10.2 Create `tests.html` with fast-check loaded from a local file
    - Download fast-check and save as `fast-check.min.js` alongside `index.html`
    - Create `tests.html` that loads `fast-check.min.js` via `<script src="fast-check.min.js">` and a minimal `assert` helper
    - Extract all pure functions (`_getGreeting`, `_formatTime`, `_formatDate`, `_formatDisplay`, `_normalizeUrl`, `_isValidUrl`, `clearCompleted`, and StorageService logic) into a shared `<script>` or inline them in `tests.html` for testing
    - Tag each test with `// Feature: todo-life-dashboard, Property N: <property_text>`
    - _Requirements: 10.2, 10.3_

  - [ ]* 10.3 Write all 18 property-based tests in `tests.html`
    - Implement Properties 1–18 using `fc.assert(fc.property(...))` with minimum 100 iterations each
    - Use arbitraries from the design document's testing strategy table
    - _Requirements: all correctness properties_

  - [ ]* 10.4 Write unit tests for boundary and edge cases in `tests.html`
    - `getGreeting` at each boundary hour: 0, 4, 5, 10, 11, 17, 18, 20, 21, 23
    - `formatDisplay(0)` → `"00:00"`, `formatDisplay(1500)` → `"25:00"`, `formatDisplay(90)` → `"01:30"`
    - `normalizeUrl` with and without existing scheme; `isValidUrl` with valid and invalid inputs
    - `clearCompleted` with mixed, all-complete, and all-incomplete lists
    - `StorageService.get` with corrupt JSON; task edit confirm with empty string restores original description
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 2.3, 7.5, 7.6, 5.4, 8.4, 4.3_

- [~] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical milestones
- Property tests validate universal correctness properties across all valid inputs
- Unit tests validate specific examples, boundary values, and error conditions
- fast-check must be stored locally — no CDN usage per Requirement 10.2
- All pure functions should be defined before module objects so they can be imported into `tests.html` without DOM dependencies
- Requirement 9.5 (2-second load time on 10 Mbps) is inherently satisfied by the zero-dependency single-file architecture; no additional optimisation tasks are needed

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["1.3", "1.4", "3.1", "6.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4", "3.5", "4.1", "6.2"] },
    { "id": 4, "tasks": ["4.2", "4.3", "6.3", "6.4", "6.5", "6.6", "8.1"] },
    { "id": 5, "tasks": ["4.4", "6.7", "6.8", "7.1", "8.2", "8.3", "8.4", "8.5"] },
    { "id": 6, "tasks": ["7.2", "7.3", "8.6", "8.7", "8.8"] },
    { "id": 7, "tasks": ["10.1"] },
    { "id": 8, "tasks": ["10.2"] },
    { "id": 9, "tasks": ["10.3", "10.4"] }
  ]
}
```
