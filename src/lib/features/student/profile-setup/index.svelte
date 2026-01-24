<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { enhance } from '$app/forms';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { schema } from '$lib/server/database';

  interface Props {
    user: Pick<schema.User, 'givenName' | 'familyName'>;
  }

  const { user }: Props = $props();
</script>

<Card.Root class="mx-auto max-w-md">
  <Card.Header>
    <Card.Title>Complete Your Profile</Card.Title>
    <Card.Description>
      Please provide your student number to continue. This can only be set once.
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <form
      method="post"
      action="/dashboard/student/?/profile"
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
      <div class="space-y-2">
        <Label for="student-number">Student Number</Label>
        <Input
          required
          type="number"
          min="100000000"
          max="1000000000"
          name="student-number"
          id="student-number"
          placeholder="2020XXXXX"
        />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="given">Given Name</Label>
          <Input
            required
            type="text"
            name="given"
            id="given"
            placeholder={user.givenName}
            value={user.givenName}
          />
        </div>
        <div class="space-y-2">
          <Label for="family">Family Name</Label>
          <Input
            required
            type="text"
            name="family"
            id="family"
            placeholder={user.familyName}
            value={user.familyName}
          />
        </div>
      </div>
      <Button type="submit" class="w-full">Complete Profile</Button>
    </form>
  </Card.Content>
</Card.Root>
