<script lang="ts">
  import { store, type View } from "$lib/store.svelte";
  import Icon from "./Icon.svelte";
import Logo from "./Logo.svelte";
  import NeuBadge from "./NeuBadge.svelte";
  import NeuButton from "./NeuButton.svelte";
  import { toast } from "$lib/toasts";
  import PromptModal from "./PromptModal.svelte";
  import ConfirmModal from "./ConfirmModal.svelte";

  const VIEWS: { id: View; label: string; icon: string; key: string }[] = [
    { id: "board", label: "Board", icon: "columns", key: "1" },
    { id: "calendar", label: "Calendar", icon: "calendar", key: "2" },
    { id: "backlog", label: "Backlog", icon: "inbox", key: "3" },
  ];

  const BOARD_COLORS = [
    "#ff4d6d",
    "#7c6cf0",
    "#f59e0b",
    "#16a34a",
    "#3b82f6",
    "#ec4899",
    "#14b8a6",
    "#8b5cf6",
  ];

  let renaming = $state<string | null>(null);
  let draft = $state("");

  // Modals
  let addBoardOpen = $state(false);
  let deleteBoardOpen = $state(false);
  let deleteBoardId = $state<string | null>(null);
  let deleteBoardTitle = $state("");

  let boards = $derived(store.boards());
  let stats = $derived(store.stats());

  function openBoard(id: string) {
    store.selectBoard(id);
    store.view = "board";
  }

  function addBoard() {
    addBoardOpen = true;
  }

  function onAddBoardConfirm(name: string) {
    if (name) {
      const b = store.addBoard(name, BOARD_COLORS[boards.length % BOARD_COLORS.length]);
      toast(`Created “${b.title}”`, "success");
    }
    addBoardOpen = false;
  }

  function onAddBoardCancel() {
    addBoardOpen = false;
  }

  function startRename(id: string, title: string) {
    renaming = id;
    draft = title;
  }

  function commitRename() {
    if (renaming) store.renameBoard(renaming, draft);
    renaming = null;
  }

  function cycleColor(id: string) {
    const b = store.board(id);
    if (!b) return;
    const i = BOARD_COLORS.indexOf(b.color);
    store.recolorBoard(id, BOARD_COLORS[(i + 1) % BOARD_COLORS.length]);
  }

  function removeBoard(id: string, title: string) {
    deleteBoardId = id;
    deleteBoardTitle = title;
    deleteBoardOpen = true;
  }

  function onDeleteBoardConfirm() {
    if (deleteBoardId) {
      store.deleteBoard(deleteBoardId);
      toast("Board deleted", "info");
    }
    deleteBoardOpen = false;
    deleteBoardId = null;
    deleteBoardTitle = "";
  }

  function onDeleteBoardCancel() {
    deleteBoardOpen = false;
    deleteBoardId = null;
    deleteBoardTitle = "";
  }

  function viewCount(v: View): number | null {
    if (v === "backlog") return stats.backlog;
    return null;
  }
</script>

<aside class="side">
  <div class="brand">
    <span class="logo"><Logo size={28} /></span>
    <span class="truncate">Tulip Tasks</span>
  </div>

  <nav>
    {#each VIEWS as v (v.id)}
      <button
        type="button"
        class="view"
        class:on={store.view === v.id}
        onclick={() => (store.view = v.id)}
      >
        <Icon name={v.icon} size={17} strokeWidth={2.3} />
        <span class="grow truncate">{v.label}</span>
        {#if viewCount(v.id) !== null}
          <NeuBadge tone={viewCount(v.id) ? "accent" : "default"} size="sm">{viewCount(v.id)}</NeuBadge>
        {/if}
        <kbd>{v.key}</kbd>
      </button>
    {/each}
  </nav>

  <div class="sec-head">
    <span>Boards</span>
    <NeuButton size="icon" variant="ghost" title="New board" onclick={addBoard}>
      <Icon name="plus" size={15} strokeWidth={2.8} />
    </NeuButton>
  </div>

  <div class="boards">
    {#each boards as b (b.id)}
      {@const s = store.stats(b.id)}
      <div class="board" class:on={store.activeBoardId === b.id}>
        <button class="swatch" type="button" title="Change colour" onclick={() => cycleColor(b.id)}>
          <span style:--c={b.color}></span>
        </button>

        {#if renaming === b.id}
          <!-- svelte-ignore a11y_autofocus -->
          <input
            class="rename"
            bind:value={draft}
            autofocus
            onblur={commitRename}
            onkeydown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") renaming = null;
            }}
          />
        {:else}
          <button class="bname truncate" type="button" ondblclick={() => startRename(b.id, b.title)} onclick={() => openBoard(b.id)}>
            {b.title}
          </button>
        {/if}

        <span class="count mono" title="{s.open} open, {s.overdue} overdue">{s.open}</span>

        <div class="tools">
          <button type="button" title="Move up" onclick={() => store.moveBoard(b.id, -1)}>
            <Icon name="chevron-up" size={13} strokeWidth={3} />
          </button>
          <button type="button" title="Move down" onclick={() => store.moveBoard(b.id, 1)}>
            <Icon name="chevron-down" size={13} strokeWidth={3} />
          </button>
          <button
            type="button"
            title="Delete board"
            onclick={() => removeBoard(b.id, b.title)}
          >
            <Icon name="trash" size={13} strokeWidth={2.6} />
          </button>
        </div>
      </div>
    {/each}

    {#if boards.length === 0}
      <button class="new" type="button" onclick={addBoard}>
        <Icon name="plus" size={15} strokeWidth={2.8} /> First board
      </button>
    {/if}
  </div>

  <div class="foot">
    <div class="stat-row">
      <NeuBadge tone={stats.overdue ? "overdue" : "default"} size="sm">
        {stats.overdue} overdue
      </NeuBadge>
      <NeuBadge tone={stats.dueToday ? "accent" : "default"} size="sm">
        {stats.dueToday} today
      </NeuBadge>
    </div>
    <NeuButton size="sm" variant="flat" full onclick={() => (store.paletteOpen = true)}>
      <Icon name="search" size={14} strokeWidth={2.6} /> Commands
      <kbd>⌘K</kbd>
    </NeuButton>
  </div>
</aside>

<PromptModal
  bind:open={addBoardOpen}
  title="New board"
  message=""
  placeholder="Board name"
  defaultValue="New board"
  validate={undefined}
  onconfirm={onAddBoardConfirm}
  oncancel={onAddBoardCancel}
/>

<ConfirmModal
  bind:open={deleteBoardOpen}
  title="Delete board"
  message={`Delete board "${deleteBoardTitle}" and all its tasks? This cannot be undone.`}
  onconfirm={onDeleteBoardConfirm}
  oncancel={onDeleteBoardCancel}
/>

<style>
  .side {
    width: var(--sidebar-w);
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border-right: var(--border);
    background: var(--surface);
    overflow-y: auto;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 9px;
    font-weight: 900;
    font-size: 15px;
    padding-bottom: 2px;
  }
  .logo {
    width: 28px;
    height: 28px;
    flex: none;
    border: var(--border-thin);
    border-radius: var(--radius-sm);
    background: var(--primary);
    color: var(--text-on-primary);
    display: grid;
    place-items: center;
    box-shadow: var(--shadow-hair);
  }

  nav {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .view {
    display: flex;
    align-items: center;
    gap: 9px;
    border: var(--border-thin);
    border-color: transparent;
    border-radius: var(--radius-md);
    background: transparent;
    padding: 7px 9px;
    font-weight: 800;
    text-align: left;
    width: 100%;
  }
  .view:hover {
    background: var(--surface-2);
  }
  .view.on {
    border-color: var(--border-active);
    background: var(--primary-soft);
    box-shadow: var(--shadow-flat);
  }
  .grow {
    flex: 1;
    min-width: 0;
  }

  .sec-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 2px 0;
    border-top: 2px solid var(--surface-2);
    padding-top: 10px;
  }
  .sec-head span {
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: var(--text-3);
  }

  .boards {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .board {
    display: flex;
    align-items: center;
    gap: 7px;
    border: var(--border-thin);
    border-color: transparent;
    border-radius: var(--radius-md);
    padding: 5px 7px;
  }
  .board:hover {
    background: var(--surface-2);
  }
  .board.on {
    border-color: var(--border-active);
    background: var(--surface-2);
    box-shadow: var(--shadow-flat);
  }
  .swatch {
    border: none;
    background: transparent;
    padding: 0;
    display: flex;
    flex: none;
  }
  .swatch span {
    width: 13px;
    height: 13px;
    border: var(--border-thin);
    border-radius: 4px;
    background: var(--c);
    display: block;
  }
  .bname {
    border: none;
    background: transparent;
    padding: 0;
    font-weight: 800;
    font-size: 13.5px;
    text-align: left;
    flex: 1;
    min-width: 0;
  }
  .count {
    font-size: 11px;
    font-weight: 900;
    color: var(--text-3);
  }
  .tools {
    display: none;
    gap: 1px;
  }
  .board:hover .tools {
    display: flex;
  }
  .tools button {
    border: none;
    background: transparent;
    padding: 2px;
    display: flex;
    color: var(--text-3);
    border-radius: 3px;
  }
  .tools button:hover {
    color: var(--text-1);
    background: var(--surface-3);
  }

  .rename {
    flex: 1;
    min-width: 0;
    border: 2px solid var(--primary);
    border-radius: var(--radius-sm);
    padding: 1px 5px;
    font-weight: 800;
    font-size: 13.5px;
    outline: none;
  }

  .new {
    display: flex;
    align-items: center;
    gap: 7px;
    border: 2px dashed var(--text-3);
    border-radius: var(--radius-md);
    background: transparent;
    padding: 8px 10px;
    font-weight: 800;
    color: var(--text-2);
    width: 100%;
  }
  .new:hover {
    border-color: var(--border-active);
    color: var(--text-1);
  }

  .foot {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 10px;
    border-top: 2px solid var(--surface-2);
  }
  .stat-row {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }

  kbd {
    border: var(--border-thin);
    border-radius: var(--radius-sm);
    padding: 0 5px;
    background: var(--surface-2);
    font-family: inherit;
    font-size: 10px;
    font-weight: 900;
    box-shadow: var(--shadow-micro);
    flex: none;
  }
</style>
