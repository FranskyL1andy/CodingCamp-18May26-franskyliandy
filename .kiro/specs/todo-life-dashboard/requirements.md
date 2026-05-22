# Requirements Document

## Introduction

The To-Do List Life Dashboard is a client-side web application that serves as a personal productivity homepage. It provides users with a real-time clock and greeting, a Pomodoro-style focus timer, a persistent to-do list, and a customizable quick-links panel. All data is stored in the browser's Local Storage — no backend or account required. The application is built with plain HTML, CSS, and vanilla JavaScript, and must work in all modern browsers.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Widget**: The UI section that displays the current time, date, and a time-of-day greeting message.
- **Focus_Timer**: The countdown timer widget that implements a 25-minute work session.
- **Todo_List**: The UI section that manages the user's task items.
- **Task**: A single to-do item with a text description and a completion state.
- **Quick_Links**: The UI section that displays user-defined shortcut buttons to external URLs.
- **Link**: A single quick-link entry consisting of a label and a URL.
- **Local_Storage**: The browser's `localStorage` API used for client-side data persistence.
- **Modern_Browser**: Chrome, Firefox, Edge, or Safari in a version released within the last two years.

---

## Requirements

### Requirement 1: Real-Time Greeting and Clock

**User Story:** As a user, I want to see the current time, date, and a contextual greeting when I open the Dashboard, so that I am immediately oriented to the time of day.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM:SS format, updated every second.
2. THE Greeting_Widget SHALL display the current date in the format "Weekday, DD Month YYYY" (e.g., "Monday, 26 May 2025").
3. IF the local hour is between 05 and 11 (inclusive), THEN THE Greeting_Widget SHALL display the greeting "Good Morning".
4. IF the local hour is between 11 and 17 (inclusive), THEN THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. IF the local hour is between 18 and 20 (inclusive), THEN THE Greeting_Widget SHALL display the greeting "Good Evening".
6. IF the local hour is between 21 and 23 (inclusive) or between 00 and 04 (inclusive), THEN THE Greeting_Widget SHALL display the greeting "Good Night", taking priority over all other greeting ranges.
7. THE Greeting_Widget SHALL update the displayed greeting within 1 second of the local hour boundary being crossed, without requiring a page reload.
8. IF the system clock is unavailable or returns an invalid value, THEN THE Greeting_Widget SHALL display a static placeholder (e.g., "--:--:--") in place of the time and date, and SHALL NOT attempt to continue displaying live time until the clock becomes available again.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can manage focused work sessions.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialise with a countdown value of 25 minutes and 00 seconds (25:00).
2. WHEN the user activates the Start control and the Focus_Timer is not already counting down, THE Focus_Timer SHALL begin counting down one second per real-world second.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL display the remaining time in MM:SS format.
4. WHEN the user activates the Stop control, THE Focus_Timer SHALL pause the countdown and retain the current remaining time.
5. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop any active countdown, clear the finished state if present, and restore the display to 25:00, making the timer ready for a new session.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display the label "Session Complete" to indicate the session has ended.
7. WHILE the Focus_Timer is counting down, THE Dashboard SHALL update the browser tab title to the format "MM:SS — Focus".
8. WHEN the countdown reaches 00:00 or the Reset control is activated, THE Dashboard SHALL restore the browser tab title to the application name.
9. WHEN the Focus_Timer stops counting for any reason (including the user activating the Stop control), THE Dashboard SHALL restore the browser tab title to the application name.
10. WHEN the Focus_Timer is already counting down, THE Start control SHALL be disabled so that it cannot be activated again until the timer is stopped or reset.

---

### Requirement 3: To-Do List — Add and Display Tasks

**User Story:** As a user, I want to add tasks to a list and see them displayed, so that I can track what I need to do.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a text input field and an "Add" control for creating new Tasks.
2. WHEN the user submits a non-empty task description via the Add control or by pressing the Enter key, THE Todo_List SHALL append a new Task to the list with the provided description and an incomplete state, and SHALL clear the input field.
3. IF the user attempts to submit an empty or whitespace-only task description, THEN THE Todo_List SHALL reject the submission and retain focus on the input field.
4. THE Todo_List SHALL display all Tasks in the order they were added, with completed Tasks rendered with strikethrough text to distinguish them from incomplete Tasks.
5. THE Todo_List SHALL persist all Tasks to Local_Storage after every add, edit, delete, or state-change operation.
6. WHEN the Dashboard is loaded, THE Todo_List SHALL restore all previously saved Tasks from Local_Storage and display them in their saved order and completion state.

---

### Requirement 4: To-Do List — Edit and Complete Tasks

**User Story:** As a user, I want to edit task text and mark tasks as done or undone, so that I can keep my list accurate.

#### Acceptance Criteria

1. WHEN the user activates the Edit control for a Task, THE Todo_List SHALL replace the task description with an editable text field pre-filled with the current description, and only one Task SHALL be in edit mode at a time.
2. WHEN the user confirms an edit (by pressing Enter or activating a Save control), THE Todo_List SHALL update the Task description with the new non-empty text and exit edit mode.
3. IF the user confirms an edit with empty or whitespace-only text, THEN THE Todo_List SHALL discard the change and restore the original task description.
4. WHEN the user presses the Escape key while a Task is in edit mode, THE Todo_List SHALL discard any changes and restore the original task description, exiting edit mode.
5. WHEN the user activates the checkbox or toggle control for a Task, THE Todo_List SHALL toggle the Task's completion state between complete and incomplete.
6. WHILE a Task is in the complete state, THE Todo_List SHALL render the task description with strikethrough text; WHEN the Task is toggled back to incomplete, THE Todo_List SHALL remove the strikethrough style.

---

### Requirement 5: To-Do List — Delete Tasks

**User Story:** As a user, I want to delete individual tasks and clear all completed tasks, so that I can keep my list tidy.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a Delete control for each Task.
2. WHEN the user activates the Delete control for a Task, THE Todo_List SHALL permanently remove that Task from the list and from Local_Storage.
3. THE Todo_List SHALL provide a "Clear Completed" control.
4. WHEN the user activates the "Clear Completed" control, THE Todo_List SHALL permanently remove all Tasks with a complete state from the list and from Local_Storage.
5. WHEN the Todo_List contains no completed Tasks, THE Todo_List SHALL disable the "Clear Completed" control so that it cannot be activated.
6. IF Local_Storage is unavailable during a delete operation, THEN THE Todo_List SHALL retain the Task in the list and display an inline error message indicating that the deletion could not be saved; the Task SHALL be removed from the visible list even if the error message itself fails to display.

---

### Requirement 6: Quick Links — Display and Open

**User Story:** As a user, I want to see my saved website shortcuts and open them with one click, so that I can navigate to my favourite sites quickly.

#### Acceptance Criteria

1. THE Quick_Links SHALL display each saved Link as a labelled button or card, truncating labels longer than 50 characters with a trailing ellipsis.
2. WHEN the user activates a Link button, THE Dashboard SHALL open the associated URL in a new browser tab.
3. IF the browser blocks the new tab or the URL does not begin with "http://" or "https://", THEN THE Dashboard SHALL display an inline per-link error message indicating that the link could not be opened; the error SHALL persist until the user re-activates the link or explicitly dismisses it.
4. WHEN the Dashboard is loaded, THE Quick_Links SHALL restore all previously saved Links from Local_Storage in the order they were saved.
5. IF no Links have been saved, THEN THE Quick_Links SHALL display a placeholder message prompting the user to add a link; the placeholder SHALL persist until at least one Link has been successfully saved to Local_Storage.

---

### Requirement 7: Quick Links — Add and Delete Links

**User Story:** As a user, I want to add and remove website shortcuts, so that I can customise my quick-access panel.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide controls to add a new Link by entering a label (maximum 100 characters) and a URL (maximum 2048 characters).
2. WHEN the user submits a new Link with a non-empty label and a non-empty URL within the allowed length limits, THE Quick_Links SHALL append the Link to the panel and persist it to Local_Storage.
3. IF the user submits a new Link with an empty label, an empty URL, or a value exceeding the maximum length for either field, THEN THE Quick_Links SHALL reject the submission and indicate which specific field or fields are invalid.
4. WHEN the user activates the Delete control for a Link, THE Quick_Links SHALL permanently remove that Link from the panel and from Local_Storage.
5. WHEN a new Link is saved, THE Quick_Links SHALL prepend "https://" to the URL if the URL does not already begin with "http://" or "https://".
6. IF the URL, after normalization, does not match the pattern of a valid absolute URL (i.e., scheme followed by "://" followed by a non-empty host), THEN THE Quick_Links SHALL reject the submission without saving it and display an inline validation error on the URL field.

---

### Requirement 8: Data Persistence and Storage

**User Story:** As a user, I want my tasks and links to survive page refreshes and browser restarts, so that I never lose my data.

#### Acceptance Criteria

1. THE Dashboard SHALL store all Task data under the Local_Storage key `tld_tasks`.
2. THE Dashboard SHALL store all Link data under the Local_Storage key `tld_links`.
3. WHEN any Task or Link data changes, THE Dashboard SHALL write the updated data to Local_Storage before the next user interaction is processed.
4. WHEN Local_Storage data is read on load and the stored value is not valid JSON, THE Dashboard SHALL discard the corrupted data and initialise with an empty list, ensuring no partial state is retained; this corruption handling SHALL run even when Local_Storage itself is completely unavailable, treating unavailability as a form of corruption.
5. IF Local_Storage is unavailable (e.g., blocked by browser settings or storage quota exceeded), THEN THE Dashboard SHALL display a persistent banner warning the user that data will not be saved during the session.
6. WHEN the Dashboard is loaded without network access, THE Dashboard SHALL render all widgets and restore all saved data using only Local_Storage, without making any network requests; other parts of the system MAY attempt network requests, but core dashboard functionality SHALL remain fully operational regardless of whether those requests succeed or fail.

---

### Requirement 9: Responsive Layout and Visual Design

**User Story:** As a user, I want the Dashboard to look clean and be usable on different screen sizes, so that I can use it on both desktop and laptop screens.

#### Acceptance Criteria

1. THE Dashboard SHALL render without horizontal overflow, element overlap, or a horizontal scrollbar on viewport widths from 320 px to 2560 px.
2. THE Dashboard SHALL separate the Greeting_Widget, Focus_Timer, Todo_List, and Quick_Links sections with a minimum of 16 px spacing or a visible divider between each adjacent pair of sections.
3. THE Dashboard SHALL use a readable font size of at least 14 px for body text and at least 12 px for secondary labels.
4. THE Dashboard SHALL provide sufficient colour contrast between text and background colours to meet WCAG 2.1 AA contrast ratio requirements (minimum 4.5:1 for normal text).
5. THE Dashboard SHALL load and render all widgets in a visible and interactive state within 2 seconds on a 10 Mbps connection.

---

### Requirement 10: Browser Compatibility

**User Story:** As a user, I want the Dashboard to work in any modern browser I use, so that I am not locked into a specific browser.

#### Acceptance Criteria

1. THE Dashboard SHALL render all widgets correctly and all interactive controls SHALL function without errors in the latest stable release of Chrome, Firefox, Edge, and Safari.
2. THE Dashboard SHALL use only HTML, CSS, and vanilla JavaScript, with no external frameworks, libraries, CDN-hosted scripts, or build tools required to run the application.
3. THE Dashboard SHALL operate as a standalone HTML file that can be opened directly from the local file system using the `file://` protocol or served from a static web server.
