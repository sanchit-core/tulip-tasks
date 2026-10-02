<script lang="ts">
  const ICONS: Record<string, string> = {
    tulip:
      "M12 19.4 C 9.4 18.6 7.4 16.4 6.4 14 C 5.4 11.6 5 8.8 6 6.8 C 6.2 6 6.7 5.2 7.6 5 C 8.6 4.6 9.6 5.2 10.2 6.2 C 10.7 7 11.2 8 12 8.6 C 12.8 8 13.3 7 13.8 6.2 C 14.4 5.2 15.4 4.6 16.4 5 C 17.3 5.2 17.8 6 18 6.8 C 19 8.8 18.6 11.6 17.6 14 C 16.6 16.4 14.6 18.6 12 19.4 Z M11.2 19.8 H 12.8 V 21.6 H 11.2 Z",
    board: "M3 4h18v16H3z M9 4v16 M15 4v10",
    columns: "M4 4h4v16H4z M10 4h4v11h-4z M16 4h4v7h-4z",
    calendar: "M3 5h18v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M8 2.5v3 M16 2.5v3 M3 9.5h18",
    inbox:
      "M3 12h5l1.5 3h5L16 12h5 M3 12l3-7h12l3 7v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    plus: "M12 5v14 M5 12h14",
    minus: "M5 12h14",
    x: "M18 6L6 18 M6 6l12 12",
    check: "M20 6L9 17l-5-5",
    "check-circle": "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3",
    circle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
    "alert-circle": "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 8v4 M12 16h.01",
    info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01",
    trash: "M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6",
    edit: "M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3",
    bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
    clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2",
    flag: "M4 22V4 M4 4h13l-2 4 2 4H4",
    tag: "M20.6 13.4L12 22l-9-9V3h10z M7.5 7.5h.01",
    repeat: "M17 2l4 4-4 4 M3 11V9a4 4 0 0 1 4-4h14 M7 22l-4-4 4-4 M21 13v2a4 4 0 0 1-4 4H3",
    "chevron-left": "M15 18l-6-6 6-6",
    "chevron-right": "M9 18l6-6-6-6",
    "chevron-down": "M6 9l6 6 6-6",
    "chevron-up": "M18 15l-6-6-6 6",
    "chevrons-left": "M11 17l-5-5 5-5 M18 17l-5-5 5-5",
    "chevrons-right": "M13 17l5-5-5-5 M6 17l5-5-5-5",
    grip: "M9 5h.01 M9 12h.01 M9 19h.01 M15 5h.01 M15 12h.01 M15 19h.01",
    menu: "M3 6h18 M3 12h18 M3 18h18",
    settings:
      "M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M2 14h4 M10 8h4 M18 16h4",
    download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
    upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
    refresh: "M21 12a9 9 0 1 1-3-6.7 M21 3v6h-6",
    copy: "M9 9h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
    folder: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
    filter: "M22 3H2l8 9.46V19l4 2v-8.54z",
    sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42",
    moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
    archive: "M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8 M1 3h22v5H1z M10 12h4",
    zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    arrowRight: "M5 12h14 M12 5l7 7-7 7",
    arrowUp: "M12 19V5 M5 12l7-7 7 7",
    arrowDown: "M12 5v14 M19 12l-7 7-7-7",
    maximize: "M8 3H5a2 2 0 0 0-2 2v3 M16 3h3a2 2 0 0 1 2 2v3 M8 21H5a2 2 0 0 1-2-2v-3 M16 21h3a2 2 0 0 0 2-2v-3",
    list: "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
    wand: "M15 4V2 M15 16v-2 M8 9h2 M20 9h2 M17.8 11.8L19 13 M15 9h.01 M17.8 6.2L19 5 M12.2 6.2L11 5 M3 21l9-9",
  };

  let {
    name,
    size = 20,
    strokeWidth = 2,
    fill = false,
  }: {
    name: string;
    size?: number;
    strokeWidth?: number;
    fill?: boolean;
  } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill={fill ? "currentColor" : "none"}
  stroke={fill ? "none" : "currentColor"}
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  class="icon"
>
  <path d={ICONS[name] ?? ""} />
</svg>

<style>
  .icon {
    display: block;
    flex: none;
  }
</style>
