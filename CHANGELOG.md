# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Modular store architecture (pure functions in `ids.ts`, `workspace.ts`, `sorting.ts`, `filters.ts`, `selectors.ts`, `mutations.ts`, `seed.ts`)
- Comprehensive test suite (74 tests covering all pure modules + store integration)
- Calendar overdue section (missing README feature)
- Right-click context menu on task cards (Open, Edit, Duplicate, Mark Done/Reopen, Delete)
- Removed dead code: `indexFromPointer`, `isDoneColumn`, `DropTarget`, `notify()`

### Changed
- Refactored `store.svelte.ts` from 868 lines to ~250 line reactive wrapper
- Updated CI to run tests on every push/PR
- Release workflow now generates SHA256 checksums for all installers

### Fixed
- `EMPTY_FILTERS` shared-array bug (shallow copy → factory function)
- `moveColumn` order swap logic

## [0.1.0] - 2026-10-10

### Added
- Initial release of Tulip Tasks
- Kanban board with drag-and-drop, WIP limits, custom columns
- Calendar (month/week) with drag-to-schedule, overdue section
- Backlog inbox for quick capture
- Recurring tasks (daily/weekly/monthly/yearly)
- Full-text search, tag/priority/due filters
- Command palette (Ctrl/Cmd+K)
- Desktop notifications for due/overdue tasks
- JSON export/import
- Auto-save to local JSON
- Neo-brutalist theme