<script lang="ts">
  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { schema } from '$lib/server/database';

  type Props = Pick<schema.User, 'studentNumber' | 'givenName' | 'familyName'>;
  const { studentNumber, givenName, familyName }: Props = $props();
</script>

<form
  method="post"
  action="/dashboard/profile/?/profile"
  class="space-y-4"
  use:enhance={({ submitter }) => {
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    return async ({ update }) => {
      submitter.disabled = false;
      await update();
    };
  }}
>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div class="space-y-2">
      <Label for="student-number">Student Number</Label>
      {#if studentNumber === null}
        <Input
          type="number"
          min="100000000"
          max="1000000000"
          name="student-number"
          id="student-number"
          placeholder="2020XXXXX"
        />
      {:else}
        {@const placeholder = studentNumber.toString()}
        <Input
          type="number"
          min="100000000"
          max="1000000000"
          name="student-number"
          id="student-number"
          {placeholder}
          disabled
        />
      {/if}
    </div>
    <div class="space-y-2">
      <Label for="given">Given Name</Label>
      <Input
        required
        type="text"
        name="given"
        id="given"
        placeholder={givenName}
        value={givenName}
      />
    </div>
    <div class="space-y-2">
      <Label for="family">Family Name</Label>
      <Input
        required
        type="text"
        name="family"
        id="family"
        placeholder={familyName}
        value={familyName}
      />
    </div>
  </div>
  <Button type="submit">Update</Button>
</form>
