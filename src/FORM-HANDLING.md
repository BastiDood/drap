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
