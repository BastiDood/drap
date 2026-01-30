# TypeScript Conventions

## JavaScript by Default

Use **JavaScript (`.js`)** by default. Only use TypeScript (`.ts`) when syntax requires it (e.g., type annotations, generics, interfaces).

## Discriminated Unions

Prefer discriminated unions with explicit `interface` over inlined object types:

```ts
// Good
interface SuccessResult {
  kind: 'success';
  data: string;
}

interface ErrorResult {
  kind: 'error';
  message: string;
}

type Result = SuccessResult | ErrorResult;

// Avoid
type Result = { kind: 'success'; data: string } | { kind: 'error'; message: string };
```

## Switch over If Chains

Use `switch` statements for union discrimination:

```ts
// Good
switch (result.kind) {
  case 'success':
    return result.data;
  case 'error':
    throw new Error(result.message);
}

// Avoid
if (result.kind === 'success') {
  return result.data;
} else if (result.kind === 'error') {
  throw new Error(result.message);
}
```

## Const Enum over Hardcoded Strings

```ts
// Good
const enum Status {
  Pending = 'pending',
  Active = 'active',
  Completed = 'completed',
}

// Avoid
const status = 'pending'; // hardcoded string
```

## Type Inference

Prefer type inference over explicit return types:

```ts
// Good - return type inferred
function getUser(id: string) {
  return db.query.user.findFirst({ where: eq(user.id, id) });
}

// Avoid - explicit return type when not needed
function getUser(id: string): Promise<User | undefined> {
  return db.query.user.findFirst({ where: eq(user.id, id) });
}
```

## Runtime Assertions

**Never use TypeScript non-null assertions (`!`).** Always assert at runtime:

```ts
// Good - runtime assertion
const user = await getUser(id);
if (!user) throw new Error('User not found');
return user.email;

// Avoid - TypeScript assertion
const user = await getUser(id);
return user!.email; // NEVER do this
```

Use the project's `assertSingle()` and `assertOptional()` helpers for database queries:

```ts
// Good
const user = await db.select().from(users).where(eq(users.id, id)).then(assertSingle);

// Good - when result may not exist
const user = await db.select().from(users).where(eq(users.id, id)).then(assertOptional);
```

## Valibot for Runtime Validation

Valibot schemas serve dual purposes: runtime validation and type definitions:

```ts
import * as v from 'valibot';

const UserSchema = v.object({
  id: v.string(),
  email: v.pipe(v.string(), v.email()),
  isAdmin: v.boolean(),
});

// Extract type from schema
type User = v.InferOutput<typeof UserSchema>;

// Runtime validation
const user = v.parse(UserSchema, rawData);
```
