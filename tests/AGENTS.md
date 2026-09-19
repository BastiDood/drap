# Testing Conventions

- Run `pnpm build` before running the end-to-end tests to avoid stale web server logic.
- End-to-end tests share a single database fixture.
- Order shared-state transitions through Playwright project dependencies in `playwright.config.js`.
- Run independent actor workflows and stable-state observations in parallel within a phase. Join all outcome assertions before advancing shared state.
- Use `test.describe` to group related/coupled tests and use cases for better readability.
- Use one `test` per coherent workflow and `test.step` for its actions and immediate outcome assertions.
- Only the setup project can reset and seed the database. Worker fixtures must not reset or repair domain state.
- Keep retries disabled. Diagnose failures before rerunning the full suite.

# Test Invocation Guidelines

- Always run the full suite end-to-end due to the sequential dependencies of side effects.
  - Avoid invoking the test script with suite filters; these will not work at all.
