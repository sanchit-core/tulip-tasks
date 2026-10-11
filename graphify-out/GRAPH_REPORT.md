# Graph Report - Tulip-Kanban  (2026-10-11)

## Corpus Check
- 136 files · ~74,237 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 403 file(s) not represented in the graph (top: (none) 109, .so 73, .0 53)

## Summary
- 644 nodes · 1406 edges · 41 communities (33 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 40

## God Nodes (most connected - your core abstractions)
1. `KanbanStore` - 60 edges
2. `Task` - 29 edges
3. `todayISO()` - 23 edges
4. `toast` - 22 edges
5. `nowISO()` - 21 edges
6. `task()` - 17 edges
7. `scripts` - 16 edges
8. `addDays()` - 14 edges
9. `uid()` - 14 edges
10. `store` - 14 edges

## Surprising Connections (you probably didn't know these)
- `overdueCount` --calls--> `isOverdue()`  [EXTRACTED]
  src/lib/components/BacklogView.svelte → src/lib/dates.ts
- `doResetDemo()` --calls--> `toast`  [EXTRACTED]
  src/lib/components/SettingsModal.svelte → src/lib/toasts.ts
- `triage()` --calls--> `toast`  [EXTRACTED]
  src/lib/components/BacklogView.svelte → src/lib/toasts.ts
- `confirmRemove()` --calls--> `toast`  [EXTRACTED]
  src/lib/components/BacklogView.svelte → src/lib/toasts.ts
- `onDeleteColumnConfirm()` --calls--> `toast`  [EXTRACTED]
  src/lib/components/BoardView.svelte → src/lib/toasts.ts

## Import Cycles
- None detected.

## Communities (41 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (56): uid(), addBoard(), addColumn(), addSubtask(), addTag(), addTask(), completeTask(), deleteBoard() (+48 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (5): writeWorkspace(), KanbanStore, Board, Column, Task

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (43): active, DUE_OPTIONS, tags, {
    checked = $bindable(false),
    label = "",
    onchange,
  }, due, { open = $bindable(false) }, priority, reset() (+35 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (37): @tauri-apps/api, @tauri-apps/plugin-dialog, @tauri-apps/plugin-fs, @tauri-apps/plugin-notification, desktop, { saveState = "idle" }, title, announced (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (18): active, addColOpen, addColumn(), columns, deleteCol, deleteColOpen, editingId, editTitle (+10 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (30): close(), Cmd, commands, confirmMessage, confirmOpen, confirmReject, confirmResolve, cursor (+22 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (24): app, security, windows, build, beforeBuildCommand, beforeDevCommand, devUrl, frontendDist (+16 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (19): anchor, cells, firstOpenColumn(), mode, newTitle, { onopen }, overdue, picked (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (13): addBoard(), addBoardOpen, BOARD_COLORS, boards, deleteBoardId, deleteBoardOpen, deleteBoardTitle, draft (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (16): allTags, board, columns, confirmDeleteOpen, editingTitle, open, PRIO_TONE, subDone (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.27
Nodes (16): addMonths(), addYears(), daysInMonth(), daysUntil(), dueLabel(), formatDate(), formatLongDate(), fromISO() (+8 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (16): scripts, build, check, check:watch, dev, package:tar, prepare, preview (+8 more)

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (11): description, license, name, type, version, svelte-check, @sveltejs/kit, @tauri-apps/cli (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (9): svelte, {
    icon = "inbox",
    title,
    hint = "",
    children,
  }, {
    children,
    tone = "default",
    size = "md",
    title,
  }, INK, TONE, {
    children,
    variant = "raised",
    tone = "default",
    size = "md",
    disabled = false,
    title,
    onclick,
    type = "button",
    full = false,
  }, TONE, {
    children,
    tone = "default",
    pad = "md",
    inset = false,
    raised = true,
  } (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (12): ./.svelte-kit/tsconfig.json, compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule (+4 more)

### Community 15 - "Community 15"
Cohesion: 0.32
Nodes (10): vitest, shiftDue(), addDays(), todayISO(), NewTaskInput, describeRecurrence(), nextDate(), nextOccurrenceDue() (+2 more)

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (12): APPDIR, GDK_PIXBUF_MODULE_FILE, GI_TYPELIB_PATH, GIO_MODULE_DIR, GSETTINGS_SCHEMA_DIR, GTK_DATA_PREFIX, GTK_EXE_PREFIX, GTK_IM_MODULE_FILE (+4 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (10): cols, draft, due, { onopen }, overdueCount, pendingDiscard, PRIO_TONE, priority (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.18
Nodes (11): devDependencies, node-localstorage, svelte, svelte-check, @sveltejs/adapter-static, @sveltejs/kit, @sveltejs/vite-plugin-svelte, @tauri-apps/cli (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.22
Nodes (8): {
    value = $bindable(""),
    placeholder = "",
    type = "text",
    label = "",
    icon,
    autofocus = false,
    onkeydown,
    onenter,
    min,
    max,
    name,
  }, error, handleCancel(), handleConfirm(), handleKeydown(), { open = $bindable(false), title, message = "", placeholder, defaultValue = "", validate, onconfirm, oncancel }, Props, value

### Community 20 - "Community 20"
Cohesion: 0.22
Nodes (6): cargo, cargoPath, fs, path, pkg, pkgPath

### Community 21 - "Community 21"
Cohesion: 0.25
Nodes (6): { open = $bindable(false), title, message, confirmLabel = "Delete", onconfirm, oncancel }, Props, close(), dialog, onkeydown(), {
    open = $bindable(false),
    title = "",
    width = 620,
    onclose,
    children,
    footer,
  }

### Community 22 - "Community 22"
Cohesion: 0.25
Nodes (7): close(), handleItem(), menuEl, MenuItem, {
    open = $bindable(false),
    x = 0,
    y = 0,
    items = [],
    onclose,
  }, ICONS, {
    name,
    size = 20,
    strokeWidth = 2,
    fill = false,
  }

### Community 23 - "Community 23"
Cohesion: 0.25
Nodes (8): confirmRemove(), triage(), onDeleteColumnConfirm(), onDeleteBoardConfirm(), addTag(), doRemove(), duplicate(), toast

### Community 24 - "Community 24"
Cohesion: 0.25
Nodes (7): dueToday, overdue, PRIO_TONE, recur, subDone, subTotal, {
    task,
    dragging = false,
    showBoard = false,
    boardTitle = "",
    onopen,
    ondragstart,
    oncomplete,
    oncontextmenu,
    compact = false,
  }

### Community 25 - "Community 25"
Cohesion: 0.29
Nodes (3): @sveltejs/adapter-static, @sveltejs/vite-plugin-svelte, config

### Community 26 - "Community 26"
Cohesion: 0.43
Nodes (5): ICON, dismiss(), dismissToast(), toasts, ToastType

### Community 27 - "Community 27"
Cohesion: 0.33
Nodes (6): dependencies, @tauri-apps/api, @tauri-apps/plugin-dialog, @tauri-apps/plugin-fs, @tauri-apps/plugin-notification, @tauri-apps/plugin-opener

### Community 28 - "Community 28"
Cohesion: 0.33
Nodes (5): description, identifier, permissions, $schema, windows

### Community 29 - "Community 29"
Cohesion: 0.33
Nodes (5): description, identifier, permissions, $schema, windows

### Community 30 - "Community 30"
Cohesion: 0.50
Nodes (3): bundle, targets, $schema

### Community 31 - "Community 31"
Cohesion: 0.50
Nodes (3): bundle, targets, $schema

### Community 32 - "Community 32"
Cohesion: 0.50
Nodes (3): bundle, targets, $schema

## Knowledge Gaps
- **17 isolated node(s):** `@tauri-apps/plugin-opener`, `@tauri-apps/cli`, `svelte-check`, `typescript`, `APPDIR` (+12 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 314 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `KanbanStore` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **What connects `@tauri-apps/plugin-opener`, `@tauri-apps/cli`, `svelte-check` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1104006820119352 - nodes in this community are weakly interconnected._
- **Why does `svelte` connect `Community 13` to `Community 3`, `Community 12`, `Community 19`, `Community 21`, `Community 26`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Why does `Task` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 4`, `Community 15`, `Community 17`, `Community 24`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06578947368421052 - nodes in this community are weakly interconnected._