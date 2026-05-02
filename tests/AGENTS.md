# Testing Conventions

- Run `pnpm build` before running the end-to-end tests to avoid stale web server logic.
- End-to-end tests share a single database fixture.
- Ensure correctness by enforcing serial execution of tests.
- Use `test.describe` to group related/coupled tests and use cases for better readability.
- Assert only a single piece of functionality per `test` block.

# Test Invocation Guidelines

- Always run the full suite end-to-end due to the sequential dependencies of side effects.
  - Avoid invoking the test script with suite filters; these will not work at all.
