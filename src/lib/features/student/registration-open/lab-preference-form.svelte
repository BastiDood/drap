<script module>
  const DURATION = { duration: 250 };
</script>

<script lang="ts">
  import * as v from 'valibot';
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import BoxSelectIcon from '@lucide/svelte/icons/box-select';
  import InboxIcon from '@lucide/svelte/icons/inbox';
  import XIcon from '@lucide/svelte/icons/x';
  import { crossfade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { mergeProps } from 'bits-ui';
  import { PersistedState } from 'runed';
  import { toast } from 'svelte-sonner';

  import * as Card from '$lib/components/ui/card';
  import Empty from '$lib/components/empty.svelte';
  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import type { schema } from '$lib/server/database/drizzle';
  import { TextArea } from '$lib/components/ui/textarea';
  import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';

  import AvatarConsent from './avatar-consent.svelte';
  import { DebouncedMirror } from './debounced-mirror.svelte';

  interface Props {
    user: Pick<schema.User, 'id' | 'avatarUrl'>;
    draft: Pick<schema.Draft, 'id' | 'maxRounds'>;
    availableLabs: Pick<schema.Lab, 'id' | 'name'>[];
  }

  let { user, draft, availableLabs = $bindable() }: Props = $props();

  const persistedSelectedLabs = $derived(
    new PersistedState<typeof availableLabs>(`selected-labs-${user.id}-${draft.id}`, [], {
      syncTabs: true,
    }),
  );

  const persistedAvailableLabs = $derived(
    new PersistedState<typeof availableLabs>(
      `available-labs-${user.id}-${draft.id}`,
      availableLabs,
      { syncTabs: true },
    ),
  );

  const remaining = $derived(draft.maxRounds - persistedSelectedLabs.current.length);
  const hasRemaining = $derived(remaining > 0);

  const LabRemarksSchema = v.record(v.string(), v.string());
  const labRemarks = $derived(
    new DebouncedMirror({
      key: `lab-remarks-${user.id}-${draft.id}`,
      schema: LabRemarksSchema,
      debounceMs: 500,
    }),
  );

  function updateLabRemarks(labId: string, value: string) {
    const next = { ...labRemarks.current };
    if (value === '') delete next[labId];
    else next[labId] = value;
    labRemarks.current = next;
  }

  function selectLab(index: number) {
    if (persistedSelectedLabs.current.length >= draft.maxRounds) return;
    persistedSelectedLabs.current.push(...persistedAvailableLabs.current.splice(index, 1));
  }

  function moveLabUp(above: number) {
    // eslint-disable-next-line no-param-reassign
    const below = above--;
    if (above < 0) return;

    const temp = persistedSelectedLabs.current[below];
    assert(typeof temp !== 'undefined');
    const target = persistedSelectedLabs.current[above];
    assert(typeof target !== 'undefined');

    persistedSelectedLabs.current[below] = target;
    persistedSelectedLabs.current[above] = temp;
  }

  function moveLabDown(below: number) {
    // eslint-disable-next-line no-param-reassign
    const above = below++;
    if (below >= persistedSelectedLabs.current.length) return;

    const temp = persistedSelectedLabs.current[below];
    assert(typeof temp !== 'undefined');
    const target = persistedSelectedLabs.current[above];
    assert(typeof target !== 'undefined');

    persistedSelectedLabs.current[below] = target;
    persistedSelectedLabs.current[above] = temp;
  }

  function resetSelection(index: number) {
    persistedAvailableLabs.current.push(...persistedSelectedLabs.current.splice(index, 1));
  }

  const [send, receive] = crossfade(DURATION);
</script>

<form
  method="post"
  enctype="multipart/form-data"
  action="/dashboard/student/?/submit"
  class="space-y-4"
  use:enhance={({ submitter, cancel }) => {
    const message =
      persistedSelectedLabs.current.length === 0
        ? 'Are you sure you want to skip lab preferences? You will go directly to the lottery.'
        : `Are you sure you want to select ${persistedSelectedLabs.current.length} labs?`;

    // eslint-disable-next-line no-alert
    if (!confirm(message)) {
      cancel();
      return;
    }

    labRemarks.flush();

    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;

    return async ({ update, result }) => {
      submitter.disabled = false;
      await update({ reset: false });
      switch (result.type) {
        case 'success':
          toast.success('Uploaded your lab preferences.');
          persistedAvailableLabs.disconnect();
          persistedSelectedLabs.disconnect();
          labRemarks.clear();
          break;
        case 'failure': {
          const { data, status } = result;
          switch (status) {
            case 403:
              toast.error('You have already set your lab preferences before.');
              break;
            case 400:
            case 413:
            case 415:
              toast.error(
                typeof data?.message === 'string'
                  ? data.message
                  : 'Your avatar could not be processed.',
              );
              break;
            default:
              break;
          }
          break;
        }
        default:
          toast.error(
            typeof result.status === 'undefined'
              ? 'An unknown error occurred while submitting your lab preferences.'
              : `An unknown "${result.status}" error occurred while submitting your lab preferences.`,
          );
          break;
      }
    };
  }}
>
  <input type="hidden" name="draft" value={draft.id} />
  <h1 class="text-3xl font-semibold">Select Lab Preference</h1>
  <p>
    Select your preferred labs from the list of available labs and rank them by order of preference.
  </p>
  <AvatarConsent avatarUrl={user.avatarUrl} />
  <div class="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
    <Card.Root variant="soft" class="flex h-full">
      <Card.Header>
        <Card.Title class="text-2xl">Available Labs</Card.Title>
      </Card.Header>
      <Card.Content class="flex grow flex-col">
        <ul
          inert={persistedSelectedLabs.current.length >= draft.maxRounds}
          class="space-y-2 empty:hidden inert:opacity-20"
        >
          {#each persistedAvailableLabs.current as { id, name }, idx (id)}
            {@const config = { key: id }}
            <li in:receive={config} out:send={config} animate:flip={DURATION}>
              <button
                type="button"
                class="w-full flex-auto rounded-md bg-muted p-4 text-left transition duration-150 hover:bg-muted/80"
                onclick={selectLab.bind(null, idx)}
              >
                {name}
              </button>
            </li>
          {/each}
        </ul>
        {#if persistedAvailableLabs.current.length === 0}
          <div class="flex grow items-center justify-center">
            <Empty media={{ icon: InboxIcon, size: 'sm' }}>
              {#snippet title()}No more labs available{/snippet}
              {#snippet description()}There are no more labs remaining in the list.{/snippet}
            </Empty>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
    <Card.Root variant="soft" class="flex h-full">
      <Card.Header>
        <Card.Title class="text-2xl">Ranking</Card.Title>
        <span>
          {#if hasRemaining}
            You may select up to <span class="font-bold">{remaining}</span>
            {#if remaining === 1}lab{:else}labs{/if} left.
          {:else}
            You may no longer select any more labs.
          {/if}
        </span>
      </Card.Header>
      <Card.Content class="flex grow flex-col">
        <ol class="space-y-2 empty:hidden">
          {#each persistedSelectedLabs.current as { id, name }, idx (id)}
            {@const config = { key: id }}
            <li
              class="flex flex-col gap-4 rounded-lg border border-border bg-muted/20 p-4 transition-shadow hover:shadow-md dark:bg-muted"
              in:receive={config}
              out:send={config}
              animate:flip={DURATION}
            >
              <input type="hidden" name="labs" value={id} />
              <div class="flex items-center gap-3">
                <div
                  class="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary pb-0.5 text-lg font-semibold text-secondary-foreground"
                >
                  {idx + 1}
                </div>
                <div class="grow">{name}</div>
                <div class="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger>
                      {#snippet child({ props })}
                        <Button
                          type="button"
                          size="icon"
                          class="bg-success text-success-foreground hover:bg-success/80"
                          disabled={idx <= 0}
                          {...mergeProps(props, { onclick: moveLabUp.bind(null, idx) })}
                        >
                          <ArrowUpIcon class="size-5" />
                        </Button>
                      {/snippet}
                    </TooltipTrigger>
                    <TooltipContent>Move Up</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger>
                      {#snippet child({ props })}
                        <Button
                          type="button"
                          size="icon"
                          class="bg-warning text-warning-foreground hover:bg-warning/80"
                          disabled={idx >= persistedSelectedLabs.current.length - 1}
                          {...mergeProps(props, { onclick: moveLabDown.bind(null, idx) })}
                        >
                          <ArrowDownIcon class="size-5" />
                        </Button>
                      {/snippet}
                    </TooltipTrigger>
                    <TooltipContent>Move Down</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger>
                      {#snippet child({ props })}
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          {...mergeProps(props, { onclick: resetSelection.bind(null, idx) })}
                        >
                          <XIcon class="size-5" />
                        </Button>
                      {/snippet}
                    </TooltipTrigger>
                    <TooltipContent>Remove Selection</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <TextArea
                name="remarks"
                placeholder="Hello {id.toUpperCase()}, my name is... I would like to do more research on..."
                maxlength={1028}
                bind:value={
                  () => labRemarks.current?.[id] ?? '', value => updateLabRemarks(id, value)
                }
              />
            </li>
          {/each}
        </ol>
        {#if persistedSelectedLabs.current.length === 0}
          <div class="flex grow items-center justify-center">
            <Empty media={{ icon: BoxSelectIcon, size: 'sm' }}>
              {#snippet title()}No labs selected{/snippet}
              {#snippet description()}
                Click on a lab from the available list to add it to your ranking.
              {/snippet}
            </Empty>
          </div>
        {/if}
      </Card.Content>
      <Card.Footer class="self-end">
        <Button type="submit">Submit Lab Preferences</Button>
      </Card.Footer>
    </Card.Root>
  </div>
</form>
