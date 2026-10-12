<script lang="ts">
  import { onMount } from "svelte";
  let { size = 28 } = $props();
</script>

<img
  src="/tulip-tasks-icon.svg"
  alt="Tulip Tasks"
  width={size}
  height={size}
  style={`
    display: block;
    flex-shrink: 0;
    width: calc(${size}px);
    height: calc(${size}px);
  `}
  referrerpolicy="no-referrer"
/>