<script module>
  const DURATION = { duration: 250 };
</script>

<script lang="ts">
  import { ArrowDown, ArrowUp, XMark } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { assert } from '$lib/assert';
  import { crossfade } from 'svelte/transition';
  import { enhance } from '$app/forms';
  import { flip } from 'svelte/animate';
  import type { schema } from '$lib/server/database';
  import { useToaster } from '$lib/toast';

  import ErrorAlert from '$lib/alerts/Error.svelte';
  import WarningAlert from '$lib/alerts/Warning.svelte';

  type Lab = Pick<schema.Lab, 'id' | 'name'>;
  interface Props {
    draftId: schema.Draft['id'];
    maxRounds: schema.Draft['maxRounds'];
    availableLabs: Lab[];
  }

  // eslint-disable-next-line prefer-const
  let { draftId, maxRounds, availableLabs = $bindable() }: Props = $props();

  const toaster = useToaster();
  let selectedLabs = $state<typeof availableLabs>([]);

  const remaining = $derived(maxRounds - selectedLabs.length);
  const hasRemaining = $derived(remaining > 0);
  const cardVariant = $derived(
    hasRemaining
      ? 'preset-tonal-primary border border-primary-500'
      : 'preset-tonal-secondary border border-secondary-500',
  );

  function selectLab(index: number) {
    if (selectedLabs.length >= maxRounds) return;
    selectedLabs.push(...availableLabs.splice(index, 1));
    selectedLabs = selectedLabs;
    availableLabs = availableLabs;
  }

  function moveLabUp(above: number) {
    // eslint-disable-next-line no-param-reassign
    const below = above--;
    if (above < 0) return;

    const temp = selectedLabs[below];
    assert(typeof temp !== 'undefined');
    const target = selectedLabs[above];
    assert(typeof target !== 'undefined');

    selectedLabs[below] = target;
    selectedLabs[above] = temp;
  }

  function moveLabDown(below: number) {
    // eslint-disable-next-line no-param-reassign
    const above = below++;
    if (below >= selectedLabs.length) return;

    const temp = selectedLabs[below];
    assert(typeof temp !== 'undefined');
    const target = selectedLabs[above];
    assert(typeof target !== 'undefined');

    selectedLabs[below] = target;
    selectedLabs[above] = temp;
  }

  function resetSelection(index: number) {
    availableLabs.push(...selectedLabs.splice(index, 1));
  }

  const [send, receive] = crossfade(DURATION);
</script>

<form
  method="post"
  class="space-y-4"
  use:enhance={({ submitter, cancel }) => {
    if (!confirm(`Are you sure you want to select ${selectedLabs.length} labs?`)) {
      cancel();
      return;
    }
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    return async ({ update, result }) => {
      submitter.disabled = false;
      await update({ reset: false });
      switch (result.type) {
        case 'success':
          toaster.success({ title: 'Uploaded your lab preferences.' });
          break;
        case 'failure':
          switch (result.status) {
            case 400:
              toaster.error({ title: 'Empty submissions are not allowed.' });
              break;
            case 403:
              toaster.error({ title: 'You have already set your lab preferences before.' });
              break;
            default:
              break;
          }
          break;
        default:
          break;
      }
    };
  }}
>
  <input type="hidden" name="draft" value={draftId} />
  <div class="card {cardVariant} prose dark:prose-invert max-w-none p-4 transition duration-150">
    <p>
      Lab preferences are ordered by preference from top (most preferred) to bottom (least
      preferred).
    </p>
    <p>
      You may also include remarks alongside your lab rankings. These remarks will only be visible
      to the heads of the labs you have selected.
    </p>
    <p>
      {#if hasRemaining}
        You may select up to <strong>{remaining}</strong> labs left.
      {:else}
        You may no longer select any more labs.
      {/if}
    </p>
    <button type="submit" class="preset-filled-primary-500 btn">Submit Lab Preferences</button>
  </div>
  <hr class="!border-surface-500 !border-t-4" />
  {#if selectedLabs.length > 0}
    <ol class="space-y-2">
      {#each selectedLabs as { id, name }, idx (id)}
        {@const config = { key: id }}
        <li
          class="card preset-tonal-surface border-surface-500 card-hover flex flex-col gap-4 border p-4"
          in:receive={config}
          out:send={config}
          animate:flip={DURATION}
        >
          <input type="hidden" name="labs" value={id} />
          <div class="flex items-center gap-3">
            <div class="text-md preset-filled-secondary-500 badge-icon p-4 text-lg font-bold">
              {idx + 1}
            </div>
            <div class="grow">{name}</div>
            <div class="flex gap-2">
              <button
                type="button"
                class="preset-filled-success-500 btn-icon btn-icon-sm"
                onclick={moveLabUp.bind(null, idx)}
                disabled={idx <= 0}
              >
                <Icon src={ArrowUp} class="size-6" />
              </button>
              <button
                type="button"
                class="preset-filled-warning-500 btn-icon btn-icon-sm"
                onclick={moveLabDown.bind(null, idx)}
                disabled={idx >= selectedLabs.length - 1}
              >
                <Icon src={ArrowDown} class="size-6" />
              </button>
              <button
                type="button"
                class="preset-filled-error-500 btn-icon btn-icon-sm"
                onclick={resetSelection.bind(null, idx)}
              >
                <Icon src={XMark} class="size-6" />
              </button>
            </div>
          </div>
          <textarea
            class="card preset-filled-surface-200-800 border-surface-500 h-16 min-h-16 w-full"
            name="remarks"
            placeholder="Hi, my name is... I would like to do more research on..."
            maxlength="1028"
          ></textarea>
        </li>
      {/each}
    </ol>
  {:else}
    <WarningAlert>No labs selected yet.</WarningAlert>
  {/if}
</form>
<hr class="!border-surface-500 !border-t-4" />
{#if availableLabs.length > 0}
  <ul
    inert={selectedLabs.length >= maxRounds}
    class="space-y-1 overflow-hidden rounded-xl inert:opacity-20"
  >
    {#each availableLabs as { id, name }, idx (id)}
      <li>
        <button
          class="preset-filled-surface-200-800 hover:preset-filled-surface-100-900 w-full flex-auto p-4 transition duration-150"
          onclick={selectLab.bind(null, idx)}
        >
          {name}
        </button>
      </li>
    {/each}
  </ul>
{:else}
  <ErrorAlert>No more labs with remaining slots left.</ErrorAlert>
{/if}
