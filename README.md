# Tulip Tasks

A neo-brutalist task board with a calendar, a backlog inbox and recurring tasks.
SvelteKit + Tauri 2 desktop app, local-first, no server required.

![svelte](https://img.shields.io/badge/svelte-5-ff4d6d) ![tauri](https://img.shields.io/badge/tauri-2-7c6cf0)

## Features

**Board**
- Drag-and-drop columns and cards, hand-rolled on pointer events (no DnD dependency)
- Custom columns with WIP limits that turn red when exceeded
- Dropping onto a column marked *Done* auto-completes the task; dragging it back reopens it
- Boards are colour-coded, reorderable, renameable and deletable

**Calendar**
- Month and week views
- Drop a card on a day to schedule it
- Unscheduled tasks listed underneath with an inline date picker — drag the grip onto a day
- Overdue section and a daily digest

**Backlog inbox**
- Capture anything without deciding where it belongs
- Triage with one click onto any column, or drag it onto the board
- Optional priority, due date and tags at capture time

**Tasks**
- Subtasks with progress bar, tags, priority, notes, due date
- Recurrence (daily / weekly / monthly / yearly, every N) — completing a recurring
  task spawns the next occurrence, skipping forward past today if you let it lapse
- Duplicate, delete, complete/reopen

**Search & filters**
- Full-text across title, notes and tags (`/`)
- Filter by tag, priority, and due-date window; hide completed

**Everything else**
- Command palette on <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>K</kbd> — boards, tasks, actions
- Desktop notifications for due and overdue tasks
- JSON export / import for backups
- Auto-saves to a JSON file on every change

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> | Command palette |
| <kbd>N</kbd> | Quick capture to inbox |
| <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> | Board / Calendar / Backlog |
| <kbd>/</kbd> | Focus search |
| <kbd>B</kbd> | Toggle sidebar |
| <kbd>,</kbd> | Settings |
| <kbd>Esc</kbd> | Close dialog or task |
| <kbd>?</kbd> | Shortcut help |

## Running it

```bash
npm install
npm run tauri dev      # desktop app
npm run dev            # browser only (data in localStorage)
```

Build a desktop binary:

```bash
npm run tauri build
```

### NixOS note

`npm run tauri` sources `~/.config/tauri-build/env.sh` first, which puts `cargo`,
`rustc` and a C compiler on `PATH` and points `PKG_CONFIG_PATH` at the nix store.
None of those are on `PATH` on a stock NixOS system, so without it the Tauri CLI
dies with `failed to run 'cargo metadata'`. The script also satisfies glib's
`Requires.private: sysprof-capture-4` with a stub `.pc` file, because
`libsysprof-capture` has never been built on this machine.

To use cargo directly in a shell, source it once:

```bash
source ~/.config/tauri-build/env.sh
```

The first `tauri dev` links the whole GTK/WebKit stack and takes a while
(~55 min on this machine). Incremental rebuilds after that are seconds.

## Where your data lives

On the desktop the whole workspace is one human-readable JSON file:

```
~/.local/share/com.sanchixt.tuliptasks/workspace.json
```

In the browser it falls back to `localStorage`. Writes are debounced 250 ms and
flushed on window close; the title bar shows the current save state.

**Export** (gear icon or command palette) writes a dated JSON file wherever you
pick, so you can back the workspace up or move it between machines.

## Layout

```
src/
  app.css                 design tokens (neo-brutalist: ink borders, offset shadows)
  routes/
    +layout.svelte        boot, notifier, toasts
    +page.svelte          app shell, drag/drop wiring, keyboard shortcuts
  lib/
    types.ts              Task / Column / Board / Settings, default settings
    store.svelte.ts       the single reactive store + all mutations + demo seed
    dnd.svelte.ts         pointer-based drag controller and hit-testing
    persist.ts            read/write workspace.json, tolerant parser
    notify.ts             due-date + digest notifications
    transfer.ts           export/import file dialogs
    dates.ts              local-time ISO date maths, month/week grids
    recurrence.ts         recurrence descriptions and next-occurrence dates
    toasts.ts             toast queue
    components/           UI, all neo-brutalist
src-tauri/                Rust shell: opener, notification, dialog, fs plugins
```

## Dark mode

Tulip Tasks supports system theme detection and manual light/dark mode selection:

- **Follow system**: The app automatically uses your operating system's light/dark preference
- **Force light mode**: Always use the neo-brutalist light theme
- **Force dark mode**: Always use the dark theme

Theme settings are available in the app's Settings modal (accessible via the gear icon
or command palette <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>K</kbd>). The preference is saved
locally and persists across launches.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run check` | `svelte-check` type + a11y check |
| `npm run build` | Production frontend build |
| `npm run tauri dev` | Desktop app with hot reload |
| `npm run tauri build` | Packaged desktop binary |

## Installing on other Linux distributions

The app can be installed on any Linux distribution with the provided installation script:

```bash
bash install-tulip-tasks.sh
```

This script:

1. Downloads the latest AppImage from the GitHub releases
2. Places it in `~/.local/tulip-tasks/`
3. Creates a symlink in `~/.local/bin/tulip-tasks`
4. Creates a desktop entry in `~/.local/share/applications/`
5. Adds `~/.local/bin` to your PATH (in `.bashrc` or `.zshrc`)
6. Creates a `.desktop` entry for your application menu
7. Updates the icon cache

You can also download the AppImage directly from the GitHub releases page and run it:

```bash
chmod +x tulip-tasks_0.1.5_linux_x86_64.AppImage
./tulip-tasks_0.1.5_linux_x86_64.AppImage
```

The AppImage runs without installation — just make it executable and launch it.
All settings and data are stored in `~/.local/share/com.sanchixt.tuliptasks/`.

## Dark mode

Theme settings are available in the app's Settings modal (accessible via the gear icon
or command palette <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>K</kbd>):

- **Follow system**: The app automatically uses your operating system's light/dark preference
- **Force light mode**: Always use the neo-brutalist light theme
- **Force dark mode**: Always use the dark theme

Theme preferences are saved locally and persist across launches.

## Where your data lives

On the desktop the whole workspace is one human-readable JSON file:

```
~/.local/share/com.sanchixt.tuliptasks/workspace.json
```

In the browser it falls back to `localStorage`.

**Export** (gear icon or command palette) writes a dated JSON file wherever you
pick, so you can back the workspace up or move it between machines.

## License

MIT