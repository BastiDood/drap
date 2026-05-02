<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import * as NativeSelect from '$lib/components/ui/native-select';
  import Callout from '$lib/components/callout.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  interface Props {
    avatarUrl: string;
  }

  const { avatarUrl }: Props = $props();

  let consent = $state<'' | 'none' | 'google' | 'custom'>('');
</script>

<Card.Root variant="soft">
  <Card.Header>
    <Card.Title>Profile Photo</Card.Title>
    <Card.Description>
      How lab faculty will see you during review. This choice is final once you submit.
    </Card.Description>
  </Card.Header>
  <Card.Content class="space-y-4">
    {#if consent === 'none'}
      <Callout variant="destructive" title="You are declining to share a photo">
        Faculty reviewers rely partly on profile photos to recall applicants during deliberations
        across rounds. Submitting without one may reduce how memorable your application is relative
        to peers who share theirs. By continuing, you acknowledge and accept this trade-off. The
        draft outcome cannot be appealed on the basis of this choice.
      </Callout>
    {:else if consent === 'google'}
      <Callout variant="warning" title="Your profile picture will be snapshotted at submission">
        Your current profile picture is captured once at the moment you submit this form. It is not
        a live link. If you change or remove your profile picture afterward, the image that the
        faculty will see during review will be the same. Make sure the photo displayed above is the
        one you want faculty to see before submitting.
      </Callout>
    {:else if consent === 'custom'}
      <Callout variant="warning" title="Your photo is your first impression">
        Every lab you rank will see this image while deciding whom to accept. Choose one that is
        clear, recognizable, and appropriate for an academic setting. You cannot replace or remove
        it after submission.
      </Callout>
    {/if}
    <div class="space-y-2">
      <Label for="avatar-consent">Photo Consent</Label>
      <NativeSelect.Root id="avatar-consent" bind:value={consent} required class="w-full">
        <NativeSelect.Option value={null} disabled selected>
          Select how your photo is shared with the lab faculty&hellip;
        </NativeSelect.Option>
        <NativeSelect.Option value="none">
          I do not consent to sharing any photo with lab faculty during this draft.
        </NativeSelect.Option>
        {#if avatarUrl !== ''}
          <NativeSelect.Option value="google">
            I consent to sharing my current Google account photo with lab faculty during this draft.
          </NativeSelect.Option>
        {/if}
        <NativeSelect.Option value="custom">
          I volunteer a custom photo for lab faculty to see during this draft.
        </NativeSelect.Option>
      </NativeSelect.Root>
    </div>
    <div class="space-y-2">
      {#if consent === 'google'}
        <input type="hidden" name="avatar" value="google" />
      {:else if consent === 'custom'}
        <Label for="avatar-file">Custom Image</Label>
        <Input
          type="file"
          id="avatar-file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp"
          required
        />
        <p class="text-xs text-muted-foreground">JPEG, PNG, or WebP. Up to 4&nbsp;MiB.</p>
      {/if}
    </div>
  </Card.Content>
</Card.Root>
