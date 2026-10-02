<script lang="ts">
	import Modal from './Modal.svelte';
	import NeuButton from './NeuButton.svelte';

	interface Props {
		open: boolean;
		title: string;
		message: string;
		onconfirm: () => void;
		oncancel: () => void;
	}

	let { open = $bindable(false), title, message, onconfirm, oncancel } = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') onconfirm();
		if (e.key === 'Escape') oncancel();
	}
</script>

<Modal bind:open {title} width={360} onclose={oncancel}>
	<p class="msg">{message}</p>
	<div class="actions">
		<NeuButton variant="ghost" onclick={oncancel}>Cancel</NeuButton>
		<NeuButton variant="danger" onclick={onconfirm}>Delete</NeuButton>
	</div>

	<style>
		.msg {
			margin: 0 0 16px;
			font-size: 0.875rem;
			color: var(--muted);
			line-height: 1.5;
		}
		.actions {
			display: flex;
			justify-content: flex-end;
			gap: 8px;
		}
	</style>
</Modal>