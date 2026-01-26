<script module>
  const DURATION = { duration: 250 };
</script>

<script lang="ts">
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import XIcon from '@lucide/svelte/icons/x';
  import { crossfade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { toast } from 'svelte-sonner';

  import Callout from '$lib/components/callout.svelte';
  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/components/ui/utils';
  import { enhance } from '$app/forms';
  import type { schema } from '$lib/server/database';
  import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';

  interface Props {
    draftId: bigint;
    maxRounds: number;
    availableLabs: Pick<schema.Lab, 'id' | 'name'>[];
  }

  let { draftId, maxRounds, availableLabs = $bindable() }: Props = $props();

  let selectedLabs = $state<typeof availableLabs>([]);

  const remaining = $derived(maxRounds - selectedLabs.length);
  const hasRemaining = $derived(remaining > 0);
  const cardVariant = $derived(hasRemaining ? 'preset-tonal-secondary' : 'preset-tonal-muted');

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
  action="/dashboard/student/?/submit"
  class="space-y-4"
  use:enhance={({ submitter, cancel }) => {
    // eslint-disable-next-line no-alert
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
          toast.success('Uploaded your lab preferences.');
          break;
        case 'failure':
          switch (result.status) {
            case 400:
              toast.error('Empty submissions are not allowed.');
              break;
            case 403:
              toast.error('You have already set your lab preferences before.');
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
  <h1 class="text-3xl font-semibold">Select preferred labs</h1>
  <div
    class={cn(
      'prose dark:prose-invert mx-auto max-w-3xl rounded-lg border p-4 transition duration-150',
      cardVariant,
    )}
  >
    <p>
      Select labs from the choices below to add them to your ranking. Lab preferences are ordered by
      preference from top (most preferred) to bottom (least preferred).
    </p>
    <p>
      You may also include remarks alongside your lab rankings. These remarks will only be visible
      to the heads of the labs you have selected.
    </p>
    <p>
      {#if hasRemaining}
        <strong
          >You may select up to <span class="underline">{remaining}</span>
          {#if remaining === 1}lab{:else}labs{/if} left.</strong
        >
      {:else}
        You may no longer select any more labs.
      {/if}
    </p>
    <Button type="submit">Submit Lab Preferences</Button>
  </div>
  <hr class="border-border border-t" />
  <h2 class="text-2xl font-semibold">Ranking</h2>
  {#if selectedLabs.length > 0}
    <ol class="space-y-2">
      {#each selectedLabs as { id, name }, idx (id)}
        {@const config = { key: id }}
        <li
          class="border-border dark:bg-muted bg-muted/20 flex flex-col gap-4 rounded-lg border p-4 transition-shadow hover:shadow-md"
          in:receive={config}
          out:send={config}
          animate:flip={DURATION}
        >
          <input type="hidden" name="labs" value={id} />
          <div class="flex items-center gap-3">
            <div
              class="bg-secondary text-secondary-foreground flex size-10 items-center justify-center rounded-full pb-0.5 text-lg font-semibold"
            >
              {idx + 1}
            </div>
            <div class="grow">{name}</div>
            <div class="flex gap-2">
              <Tooltip>
                <TooltipTrigger>
                  {#snippet child({ props })}
                    <Button
                      {...props}
                      type="button"
                      size="icon"
                      class="bg-success text-success-foreground hover:bg-success/80"
                      onclick={moveLabUp.bind(null, idx)}
                      disabled={idx <= 0}
                    >
                      <ArrowUpIcon class="size-5" />
                    </Button>
                  {/snippet}
                </TooltipTrigger>
                <TooltipContent>Move up</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  {#snippet child({ props })}
                    <Button
                      {...props}
                      type="button"
                      size="icon"
                      class="bg-warning text-warning-foreground hover:bg-warning/80"
                      onclick={moveLabDown.bind(null, idx)}
                      disabled={idx >= selectedLabs.length - 1}
                    >
                      <ArrowDownIcon class="size-5" />
                    </Button>
                  {/snippet}
                </TooltipTrigger>
                <TooltipContent>Move down</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  {#snippet child({ props })}
                    <Button
                      {...props}
                      type="button"
                      size="icon"
                      variant="destructive"
                      onclick={resetSelection.bind(null, idx)}
                    >
                      <XIcon class="size-5" />
                    </Button>
                  {/snippet}
                </TooltipTrigger>
                <TooltipContent>Remove selection</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <textarea
            class="border-input bg-background h-16 min-h-16 w-full rounded-md border p-2"
            name="remarks"
            placeholder="Hi, my name is... I would like to do more research on..."
            maxlength="1028"
          ></textarea>
        </li>
      {/each}
    </ol>
  {:else}
    <Callout variant="warning">
      <p>No labs selected yet.</p>
    </Callout>
  {/if}
</form>
<hr class="border-border border-t" />
{#if availableLabs.length > 0}
  <ul inert={selectedLabs.length >= maxRounds} class="space-y-1 inert:opacity-20">
    {#each availableLabs as { id, name }, idx (id)}
      <li>
        <button
          class="bg-muted hover:bg-muted/80 w-full flex-auto rounded-md p-4 transition duration-150"
          onclick={selectLab.bind(null, idx)}
        >
          {name}
        </button>
      </li>
    {/each}
  </ul>
{:else}
  <Callout variant="destructive">
    <p>No more labs with remaining slots left.</p>
  </Callout>
{/if}
