<script lang="ts">
	import Modal from './Modal.svelte';
	import NeuInput from './NeuInput.svelte';
	import NeuButton from './NeuButton.svelte';
	import type { Component } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		message?: string;
		placeholder?: string;
		defaultValue?: string;
		validate?: (v: string) => string | null;
		onconfirm: (value: string) => void;
		oncancel: () => void;
	}

	let { open = $bindable(false), title, message = "", placeholder, defaultValue = "", validate, onconfirm, oncancel } = $props();

	let value = $state(defaultValue);
	let error = $state<string | null>(null);

	function handleConfirm() {
		if (validate) {
			const err = validate(value);
			if (err) {
				error = err;
				return;
			}
		}
		onconfirm(value);
		value = '';
		error = null;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleConfirm();
		if (e.key === 'Escape') handleCancel();
	}

	function handleCancel() {
		oncancel();
		value = '';
		error = null;
	}
</script>

<Modal bind:open {title} width={360} onclose={handleCancel}>
	{#if message}
		<p class="msg">{message}</p>
	{/if}
	<NeuInput
		bind:value
		{placeholder}
		autofocus
		onkeydown={handleKeydown}
	/>
	{#if error}
		<p id="prompt-error" class="err">{error}</p>
	{/if}
	<div class="actions">
		<NeuButton variant="ghost" onclick={handleCancel}>Cancel</NeuButton>
		<NeuButton variant="primary" onclick={handleConfirm}>OK</NeuButton>
	</div>

	<style>
		.msg {
			margin: 0 0 12px;
			font-size: 0.875rem;
			color: var(--muted);
		}
		.err {
			margin: 8px 0 0;
			font-size: 0.75rem;
			color: var(--danger);
		}
		.actions {
			display: flex;
			justify-content: flex-end;
			gap: 8px;
			margin-top: 16px;
		}
	</style>
</Modal>