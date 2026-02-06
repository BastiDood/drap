# Form Handling Conventions

This project uses `decode-formdata` + Valibot for form data validation in SvelteKit form actions.

## Pattern

```ts
import { decode } from 'decode-formdata';
import * as v from 'valibot';

// Define schema at module level
const ProfileFormData = v.object({
  studentNumber: v.optional(v.pipe(v.string(), v.minLength(1))),
  given: v.pipe(v.string(), v.minLength(1)),
  family: v.pipe(v.string(), v.minLength(1)),
});

// In the action
const data = await request.formData();
const { studentNumber, given, family } = v.parse(ProfileFormData, decode(data, {}));
```

## Field Naming

- **Always use camelCase** for form field names (e.g., `studentNumber`, `closesAt`, `userId`)
- Match schema property names to form field names exactly

## decode-formdata Options

Use `decode()` options for non-string types:

```ts
// Arrays
decode(data, { arrays: ['students', 'labs', 'remarks'] });

// Numbers
decode(data, { numbers: ['rounds', 'quota'] });

// Dates
decode(data, { dates: ['closesAt', 'startsAt'] });

// Combined
decode(data, {
  numbers: ['rounds'],
  dates: ['closesAt'],
  arrays: ['labs'],
});
```

## Common Schema Patterns

```ts
// Required non-empty string
v.pipe(v.string(), v.minLength(1));

// Optional string (empty string becomes undefined)
v.optional(v.pipe(v.string(), v.minLength(1)));

// Email validation
v.pipe(v.string(), v.email());

// Array of non-empty strings
v.array(v.pipe(v.string(), v.minLength(1)));

// Array of strings (allows empty strings)
v.array(v.string());

// Number
v.number();

// Date
v.date();
```

## Client-Side: Submitter Disabling

Every `use:enhance` callback must disable the submit button during the form action to prevent double submissions.

### Default: Single submit button

Destructure `submitter` from the enhance callback, assert it is an `HTMLButtonElement`, and toggle `disabled` directly on the DOM element.

```svelte
<script lang="ts">
  import { assert } from '$lib/assert';
  import { enhance } from '$app/forms';
</script>

<form
  method="post"
  action="/?/save"
  use:enhance={({ submitter }) => {
    assert(submitter !== null);
    assert(submitter instanceof HTMLButtonElement);
    submitter.disabled = true;
    return async ({ update, result }) => {
      submitter.disabled = false;
      await update();
      switch (result.type) {
        case 'success':
          toast.success('Saved.');
          break;
        case 'failure':
          toast.error('Failed to save.');
          break;
        default:
          break;
      }
    };
  }}
>
  <Button type="submit">Save</Button>
</form>
```

### Exception: Multiple submit buttons

When a form has multiple submit buttons (e.g., different `formaction` values), use a `$state` variable so all buttons share the disabled state.

```svelte
<script lang="ts">
  import { enhance } from '$app/forms';

  let disabled = $state(false);
</script>

<form
  method="post"
  use:enhance={() => {
    disabled = true;
    return async ({ update, result }) => {
      disabled = false;
      await update();
      // handle result...
    };
  }}
>
  <Button type="submit" {disabled} formaction="/?/promote">Promote</Button>
  <Button type="submit" {disabled} formaction="/?/remove">Remove</Button>
</form>
```
