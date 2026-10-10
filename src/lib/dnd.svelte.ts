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
  pointerX: number;
  pointerY: number;
  /** HTML of the card being dragged, for the ghost visual. */
  ghostHTML: string | null;
}

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

  /**
   * A pointer is down on a card but has not moved far enough to be a drag yet.
   * Kept separate from `state` on purpose: making the drag live inserts a drop
   * slot, which shifts the layout under the pointer, so `pointerup` lands on a
   * different element and the browser fires `click` on the common ancestor
   * instead of the card. Deferring keeps plain clicks working.
   */
  private pending: { task: Task; startX: number; startY: number; ghostHTML: string | null } | null = null;

  private targetColumnId: string | null = null;
  private targetDate: string | null = null;
  private targetIndex = 0;
  private pointerY = 0;
  private startX = 0;
  private startY = 0;
  private moved = false;
  hasValidTarget = false;

  start(task: Task, e: PointerEvent): void {
    if (e.button !== 0) return;
    // NOTE: deliberately no `e.preventDefault()` here. Canceling pointerdown also
    // suppresses the follow-up `click`, which would make cards unclickable
    // (keyboard Enter would be the only way to open a task). Selection and focus
    // stay native until a real drag begins; see `move`.
    this.targetColumnId = task.columnId;
    this.targetDate = null;
    this.targetIndex = 0;
    this.pointerY = e.clientY;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.moved = false;
    this.hasValidTarget = false;

    const cardEl = (e.target as HTMLElement).closest<HTMLElement>("[data-card]");
    this.pending = { task, startX: e.clientX, startY: e.clientY, ghostHTML: cardEl?.outerHTML ?? null };
  }

  /** Promote a pending press into a live drag. Only called past the threshold. */
  private begin(e: PointerEvent): void {
    const p = this.pending;
    if (!p) return;
    this.moved = true;
    this.state = {
      taskId: p.task.id,
      fromColumnId: p.task.columnId,
      overColumnId: p.task.columnId,
      overIndex: 0,
      overDate: null,
      pointerX: e.clientX,
      pointerY: e.clientY,
      ghostHTML: p.ghostHTML,
    };
  }

  move(e: PointerEvent): void {
    if (!this.state) {
      const p = this.pending;
      if (!p) return;
      if (Math.hypot(e.clientX - p.startX, e.clientY - p.startY) <= 5) return;
      // Past the threshold this is unambiguously a drag: stop text selection and
      // the native click, now that we know it is not a plain button press.
      e.preventDefault();
      this.begin(e);
    }
    const st = this.state;
    if (!st) return;
    this.pointerY = e.clientY;
    st.pointerX = e.clientX;

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

    st.overColumnId = this.targetColumnId;
    st.overIndex = Math.min(this.targetIndex, 9999);
    st.overDate = this.targetDate;
    st.pointerY = e.clientY;
    this.hasValidTarget = !!(slot || zone);
  }

  end(): DropResult | null {
    const s = this.state;
    const moved = this.moved;
    const hasTarget = this.hasValidTarget;
    this.state = null;
    this.pending = null;
    if (!s) return null;
    // A pointerdown/up without movement still produces a click, which should open
    // the task. A real drag produces one too, and must not.
    this.suppressClick = moved;
    if (!moved || !hasTarget) return null;
    return {
      taskId: s.taskId,
      columnId: this.targetColumnId,
      index: this.targetIndex === Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : this.targetIndex,
      iso: this.targetDate,
    };
  }

  cancel(): void {
    this.state = null;
    this.pending = null;
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

/** Shared controller so every drop zone and card talks to the same drag. */
export const dnd = new DragController();
