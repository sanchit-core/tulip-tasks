import type { Column, Task } from "./types";

/** A live drag, or null when nothing is being dragged. */
export interface DragState {
  taskId: string;
  fromColumnId: string | null;
  /** Where the pointer currently hovers. */
  overColumnId: string | null;
  overIndex: number;
  /** Set when the pointer is over a calendar day. */
  overDate: string | null;
  pointerY: number;
}

export type DropTarget =
  | { kind: "column"; columnId: string }
  | { kind: "backlog" }
  | { kind: "date"; iso: string };

export interface DropResult {
  taskId: string;
  columnId: string | null;
  index: number;
  iso: string | null;
}

/**
 * Hand-rolled pointer-based drag-and-drop.
 *
 * Instead of HTML5 drag events (which cannot be styled, fire unreliably on
 * Linux/Wayland, and give no live pointer position) we track pointermove on the
 * window and hit-test against elements tagged with `data-*` attributes.
 */
export class DragController {
  state = $state<DragState | null>(null);

  /** Set when a drag moves far enough to count, so the trailing click is ignored. */
  suppressClick = false;

  private targetColumnId: string | null = null;
  private targetDate: string | null = null;
  private targetIndex = 0;
  private pointerY = 0;
  private startX = 0;
  private startY = 0;
  private moved = false;

  start(task: Task, e: PointerEvent): void {
    if (e.button !== 0) return;
    e.preventDefault();
    this.targetColumnId = task.columnId;
    this.targetDate = null;
    this.targetIndex = 0;
    this.pointerY = e.clientY;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.moved = false;
    this.state = {
      taskId: task.id,
      fromColumnId: task.columnId,
      overColumnId: task.columnId,
      overIndex: 0,
      overDate: null,
      pointerY: e.clientY,
    };
  }

  move(e: PointerEvent): void {
    if (!this.state) return;
    this.pointerY = e.clientY;
    if (!this.moved && Math.hypot(e.clientX - this.startX, e.clientY - this.startY) > 5) {
      this.moved = true;
    }

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const slot = el?.closest<HTMLElement>("[data-drop-index]") ?? null;
    const zone = el?.closest<HTMLElement>("[data-drop-zone]") ?? null;

    if (slot) {
      this.targetDate = null;
      this.targetColumnId = slot.dataset.dropColumn || null;
      this.targetIndex = Number(slot.dataset.dropIndex ?? 0);
    } else if (zone) {
      const date = zone.dataset.dropDate ?? null;
      if (date) {
        this.targetDate = date;
        this.targetColumnId = null;
      } else {
        this.targetDate = null;
        this.targetColumnId = zone.dataset.dropColumn || null;
      }
      this.targetIndex = Number.MAX_SAFE_INTEGER;
    }

    this.state.overColumnId = this.targetColumnId;
    this.state.overIndex = Math.min(this.targetIndex, 9999);
    this.state.overDate = this.targetDate;
    this.state.pointerY = e.clientY;
  }

  end(): DropResult | null {
    const s = this.state;
    this.state = null;
    if (!s) return null;
    // A pointerdown/up without movement still produces a click, which should open
    // the task. A real drag produces one too, and must not.
    this.suppressClick = this.moved;
    return {
      taskId: s.taskId,
      columnId: this.targetColumnId,
      index: this.targetIndex === Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : this.targetIndex,
      iso: this.targetDate,
    };
  }

  cancel(): void {
    this.state = null;
  }

  /** True when the given column is the current drop target. */
  isOver(columnId: string | null): boolean {
    return this.state !== null && this.state.overDate === null && this.state.overColumnId === columnId;
  }

  isOverDate(iso: string): boolean {
    return this.state?.overDate === iso;
  }

  isDragging(taskId: string): boolean {
    return this.state?.taskId === taskId;
  }
}

/** Insertion index implied by pointer position inside a card list. */
export function indexFromPointer(list: HTMLElement | null, pointerY: number): number {
  if (!list) return 0;
  const cards = [...list.querySelectorAll<HTMLElement>("[data-card]")];
  for (let i = 0; i < cards.length; i++) {
    const r = cards[i].getBoundingClientRect();
    if (pointerY < r.top + r.height / 2) return i;
  }
  return cards.length;
}

/** Shared controller so every drop zone and card talks to the same drag. */
export const dnd = new DragController();

export function isDoneColumn(col: Column | null): boolean {
  return col?.done === true;
}
