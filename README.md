# DRAP: Draft Ranking Automated Processor

Welcome to DRAP: the Draft Ranking Automated Processor for the [University of the Philippines] [Diliman] - [Department of Computer Science]'s yearly draft of research lab assignments. In a nutshell, this web application automates the mechanics of the draft:

[University of the Philippines]: https://up.edu.ph/
[Diliman]: https://upd.edu.ph/
[Department of Computer Science]: https://dcs.upd.edu.ph/

1. All participating students register for the draft by providing their full name, email, student number, and lab rankings (ordered by preference) to the draft administrators.
1. When a draft is created, the active labs' global quotas are captured as per-draft initial quota snapshots.
1. The regular draft process begins. For each round in the draft:
   1. Draft administrators notify (typically via email) the lab heads about all of the students that have chosen their respective research lab as the first choice.
   1. Each lab selects a subset (i.e., possibly none, some, or all) of these first-choice students to accept them into the lab. After this point, the selected students are considered to be "drafted" and are thus no longer part of the next rounds.
   1. The next round begins when all of the labs have submitted their preferences. This time around, the second-choice preferences of the remaining students are evaluated (and so on).
1. Should there be students remaining by the end of the regular draft process, the lottery round begins.
1. Before the randomization stage, draft administrators first negotiate with participating labs (that have remaining slots) to check if any of the labs would like to accept some of the remaining students immediately.
1. During lottery, administrators adjust per-draft lottery quota snapshots to match remaining students exactly.
1. After manual negotiation and intervention, the remaining students are shuffled and assigned to participating labs in a round-robin fashion using the draft's lottery snapshots.
1. The draft concludes when all registered participants have been assigned to a lab.

## Development

```mermaid
flowchart TD
    subgraph External
        direction LR
        User[Browser]
        Google[Google OAuth]
    end

    subgraph Production
        HAProxy[HAProxy:80/443]
        SvelteKit[DRAP:3000]

        Drizzle[DrizzleGateway:4983]

        subgraph database [database]
            Postgres[(PostgreSQL:5432)]
        end

        subgraph durability [durability]
            direction LR
            Inngest[Inngest:8288]
            SQLite[(SQLite)]
        end

        subgraph queue [queue]
            Redis[(Redis:6379)]
        end

        subgraph telemetry [telemetry]
            O2[OpenObserve:5080]
        end

        subgraph storage [storage]
            RustFS[RustFS:9000/9001]
        end
    end

    User <--> HAProxy
    HAProxy <--> SvelteKit
    Google <-->|OAuth| HAProxy
    SvelteKit <--> Postgres
    SvelteKit <--> Inngest
    SvelteKit -.->|OpenTelemetry| O2
    Inngest <--> Redis
    Inngest <--> SQLite
    SvelteKit <--> RustFS
    Drizzle <--> Postgres
```

### Environment Variables

Development and production do not use the same environment-variable surface. The tables below split host-run app processes such as `pnpm dev`, `pnpm preview`, and `node --env-file=.env build/index.js` from the full production compose stack started by `pnpm docker:prod:app`.

<details>
<summary><strong>Development</strong></summary>

For host-run app processes, `pnpm docker:dev` already starts PostgreSQL, Inngest, OpenObserve, and RustFS with local-friendly defaults. You still need to export the app-facing variables below yourself.

| **Variable**                  | **Used by**                                 | **Required** | **Recommended**                                                                                           |
| ----------------------------- | ------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| `PUBLIC_ORIGIN`               | Public absolute URLs, metadata, and emails. | Yes          | `http://localhost:5173` for `pnpm dev`; `http://localhost:4173` for Playwright.                           |
| `ORIGIN`                      | Google OAuth callback base URL.             | Yes          | Same value as `PUBLIC_ORIGIN`.                                                                            |
| `POSTGRES_URL`                | App database connection.                    | Yes          | `postgresql://postgres:password@localhost:5432/postgres`; use `/test` in CI.                              |
| `GOOGLE_OAUTH_CLIENT_ID`      | Google OAuth login.                         | Yes          | Value from the [Google Cloud Console].                                                                    |
| `GOOGLE_OAUTH_CLIENT_SECRET`  | Google OAuth login.                         | Yes          | Value from the [Google Cloud Console].                                                                    |
| `DRAP_ENCRYPTION_KEY`         | Encrypts sensitive OAuth tokens.            | Yes          | Generate with `pnpm random:bytes -- 32`.                                                                  |
| `DRAP_ASSERT_DOMAIN`          | Allowed email-domain restriction.           | No           | `up.edu.ph` for production-like behavior.                                                                 |
| `DRAP_ENABLE_EMAILS`          | Real email delivery.                        | No           | Leave unset unless you intentionally want live email delivery.                                            |
| `S3_ENDPOINT`                 | App-facing S3 API endpoint.                 | Yes          | `http://localhost:9000` for host-run local development; do not use the Docker network hostname here.      |
| `S3_REGION`                   | S3 signing region.                          | Yes          | `us-east-1` for local development.                                                                        |
| `INNGEST_DEV`                 | Host-run app access to local Inngest.       | Yes          | `http://localhost:8288`; the server itself is provided by `pnpm docker:dev`.                              |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Local OpenTelemetry export endpoint.        | No           | `http://localhost:5080/api/default`; OpenObserve is provided by `pnpm docker:dev`.                        |
| `OTEL_EXPORTER_OTLP_HEADERS`  | Local OpenTelemetry auth headers.           | No           | `Authorization=Basic%20YWRtaW5AZXhhbXBsZS5jb206cGFzc3dvcmQ%3D`; credentials come from `compose.dev.yaml`. |

</details>

<details>
<summary><strong>Production</strong></summary>

For `pnpm docker:prod:app`, Compose derives the canonical origin from `SCHEME` and `HOST` and injects several internal defaults on your behalf. Use `pnpm docker:prod:app:tls` to add the TLS ingress override on top of the app stack.

| **Variable**                 | **Used by**                                 | **Required** | **Recommended**                                              |
| ---------------------------- | ------------------------------------------- | ------------ | ------------------------------------------------------------ |
| `SCHEME`                     | Canonical public scheme for the app origin. | Yes          | `https`                                                      |
| `HOST`                       | HAProxy ingress host matching.              | Yes          | `drap.dcs.upd.edu.ph`                                        |
| `POSTGRES_PASSWORD`          | PostgreSQL container credentials.           | Yes          | Use a strong random secret.                                  |
| `DRAP_ENCRYPTION_KEY`        | Encrypts sensitive OAuth tokens.            | Yes          | Generate with `pnpm random:bytes -- 32`.                     |
| `GOOGLE_OAUTH_CLIENT_ID`     | Google OAuth login.                         | Yes          | Value from the [Google Cloud Console].                       |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth login.                         | Yes          | Value from the [Google Cloud Console].                       |
| `INNGEST_EVENT_KEY`          | Inngest event signing.                      | Yes          | Production event key from Inngest.                           |
| `INNGEST_SIGNING_KEY`        | Inngest webhook signing.                    | Yes          | Production signing key from Inngest.                         |
| `OTEL_EXPORTER_OTLP_HEADERS` | OpenTelemetry auth headers.                 | Yes          | Percent-encoded Basic auth for your OpenObserve credentials. |
| `S3_REGION`                  | S3 signing region.                          | Yes          | Use the same region configured for the backing object store. |
| `S3_ACCESS_KEY`              | RustFS root access key.                     | Yes          | Generate with `pnpm random:bytes -- 24`.                     |
| `S3_SECRET_KEY`              | RustFS root secret key.                     | Yes          | Generate with `pnpm random:bytes -- 48`.                     |
| `ZO_ROOT_USER_EMAIL`         | OpenObserve bootstrap admin user.           | Yes          | Dedicated admin email address.                               |
| `ZO_ROOT_USER_PASSWORD`      | OpenObserve bootstrap admin password.       | Yes          | Use a strong random secret.                                  |
| `DRIZZLE_MASTERPASS`         | Drizzle Gateway admin password.             | Yes          | Use a strong random secret.                                  |

`pnpm docker:prod:app` already injects `POSTGRES_URL`, `DRAP_ASSERT_DOMAIN`, `DRAP_ENABLE_EMAILS`, `INNGEST_BASE_URL`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_PROTOCOL`, `ADDRESS_HEADER`, `XFF_DEPTH`, and the internal `S3_ENDPOINT` internally.

One-shot setup services live behind the Compose `setup` profile so they do not interfere with `docker compose up --wait`. Use `pnpm docker:dev:setup:bucket` or `pnpm docker:prod:setup:bucket` to bootstrap the RustFS bucket after the long-running services are healthy.

When `SCHEME=https`, [`compose.prod.app.tls.yaml`](/X:/projects/drap/compose.prod.app.tls.yaml) expects a repo-root [`certificate.pem`](/X:/projects/drap/certificate.pem). A symlink is acceptable. The TLS override exposes it to HAProxy as a Docker secret mounted at `/run/secrets/certificate.pem`, and HAProxy will fail to start if the file is missing or malformed. HAProxy's static config files are baked into the image at build time, so changes to [`docker/haproxy/haproxy.cfg`](/X:/projects/drap/docker/haproxy/haproxy.cfg) or [`docker/haproxy/allowed-paths.lst`](/X:/projects/drap/docker/haproxy/allowed-paths.lst) require rebuilding the HAProxy image.

</details>

[Google Cloud Console]: https://console.cloud.google.com/

> [!IMPORTANT]
> The OAuth redirect URI is computed as `${ORIGIN}/dashboard/oauth/callback`. In the production compose stack, `ORIGIN` and `PUBLIC_ORIGIN` are both derived from `SCHEME` and `HOST`. When `SCHEME=https`, HAProxy terminates TLS on port `443`, redirects port `80` to `HTTPS`, and emits HSTS on `HTTPS` responses.

[`compose.yaml`]: ./compose.yaml

### Setting up the Codebase

```bash
# Install dependencies.
pnpm install

# Generate the AES-256-GCM encryption key used for sensitive OAuth tokens.
# Save this key to the `DRAP_ENCRYPTION_KEY` environment variable in `.env`.
pnpm random:bytes -- 32

# Other useful examples:
# Save this key to the `S3_ACCESS_KEY` environment variable.
pnpm random:bytes -- 24

# Save this key to the `S3_SECRET_KEY` environment variable.
pnpm random:bytes -- 48
```

The generic helper script accepts a single positional `<bytes>` argument and prints a Base64URL-encoded random value. It is implemented in [`src/scripts/generate-random-bytes.js`](./src/scripts/generate-random-bytes.js).

### Database Commands

```bash
# Generate Drizzle migrations.
pnpm db:generate

# Apply migrations.
pnpm db:migrate

# Open Drizzle Studio UI.
pnpm db:studio
```

> [!IMPORTANT]
> You must run `pnpm db:migrate` on a fresh database in order to initialize the tables.

### Code Quality Enforcement

```bash
# Check formatting.
pnpm fmt

# Apply formatting auto-fix.
pnpm fmt:fix
```

```bash
# Check linting rules.
pnpm lint:eslint
pnpm lint:svelte

# Perform all lints in parallel.
pnpm lint
```

### Docker Compose Files

The project uses layered Docker Compose files for different environments.

```mermaid
flowchart TD
    subgraph Base
        base[compose.yaml]
    end

    subgraph Development
        dev[compose.dev.yaml]
    end

    subgraph Continuous Integration
        ci[compose.dev.ci.yaml]
    end

    subgraph Production
        prod[compose.prod.yaml]
        app[compose.prod.app.yaml]
        tls[compose.prod.app.tls.yaml]
    end

    base --> dev --> ci
    base --> prod --> app --> tls
```

| Command                         | Files                                                                                        | Services                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm docker:dev`               | `compose.yaml` + `compose.dev.yaml`                                                          | base services plus dev overrides, including `o2` and `rustfs`                         |
| `pnpm docker:dev:ci`            | `compose.yaml` + `compose.dev.yaml` + `compose.dev.ci.yaml`                                  | dev-style backing services with CI Inngest SDK URL override, excluding `o2` via reset |
| `pnpm docker:dev:setup:bucket`  | `compose.yaml` + `compose.dev.yaml` + `setup` profile                                        | one-shot `setup-bucket` bootstrap for the dev stack                                   |
| `pnpm docker:prod`              | `compose.yaml` + `compose.prod.yaml`                                                         | `postgres` (prod), `inngest` (prod), `redis`, `o2`, `rustfs`, `drizzle-gateway`       |
| `pnpm docker:prod:setup:bucket` | `compose.yaml` + `compose.prod.yaml` + `compose.prod.app.yaml` + `setup` profile             | one-shot `setup-bucket` bootstrap for the production app stack                        |
| `pnpm docker:prod:app`          | `compose.yaml` + `compose.prod.yaml` + `compose.prod.app.yaml`                               | prod services + `haproxy` ingress + `app`                                             |
| `pnpm docker:prod:app:tls`      | `compose.yaml` + `compose.prod.yaml` + `compose.prod.app.yaml` + `compose.prod.app.tls.yaml` | app stack + TLS ingress override on port `443`                                        |

> [!NOTE]
> Docker BuildKit is required to build the local services used during development. In most platforms, Docker Desktop bundles the core Docker Engine with Docker BuildKit. For others (e.g., Arch Linux), a separate `docker-buildx`-like package must be installed.
>
> This requirement is due to the fact that the [custom PostgreSQL image](./docker/postgres/Dockerfile#L9) uses the `TARGETARCH` build argument, which is typically automatically populated by Docker BuildKit.

### Running the Development Server

```bash
# Run dev services (compose.yaml + compose.dev.yaml):
# postgres, inngest (dev mode), o2, rustfs
pnpm docker:dev

# Bootstrap the RustFS bucket after the stack is healthy.
# Only needs to be done once per stack.
pnpm docker:dev:setup:bucket

# Run the Vite dev server for SvelteKit.
pnpm dev
```

### Running the Production Server

```bash
# Build the main web application (SvelteKit).
pnpm build

# Run the Vite preview server for SvelteKit.
pnpm preview

# Alternatively, run the Node.js script directly.
node --env-file=.env build/index.js
```

```bash
# Or, spin up production internal services (compose.yaml + compose.prod.yaml):
# postgres (prod), inngest (prod mode), redis, o2, rustfs, drizzle-gateway
pnpm docker:prod

# Bootstrap the RustFS bucket after the stack is healthy.
# Should be run once per redeployment.
pnpm docker:prod:setup:bucket
```

```bash
# Or, spin up full production environment (+ compose.prod.app.yaml):
# prod services + HAProxy ingress + app
# SCHEME=http uses port 80 only
pnpm docker:prod:app
```

```bash
# Or, add the TLS ingress override:
# requires repo-root ./certificate.pem when SCHEME=https
# symlink is acceptable
pnpm docker:prod:app:tls
```

The production HAProxy ingress uses a coarse path allowlist for the public site surface (`/`, `/_app/`, `/history`, `/privacy`, `/dashboard`, and root static files). Any other unmatched path is returned as an empty `404` while rate-limited requests are returned as an empty `429`. Empty responses are preferred to conserve egress bandwidth. When the TLS override is enabled with `SCHEME=https`, HAProxy terminates TLS on port `443`, redirects valid host traffic from port `80` to `HTTPS`, and emits `Strict-Transport-Security` on `HTTPS` responses.

### Local Telemetry with OpenObserve

To enable full observability in local development:

1. Start the local services (including OpenObserve):
   ```bash
   pnpm docker:dev
   ```
2. Export the OTLP endpoint and headers before running the dev server. Trace export uses OTLP over HTTP automatically:
   ```bash
   export OTEL_EXPORTER_OTLP_ENDPOINT='http://localhost:5080/api/default'
   export OTEL_EXPORTER_OTLP_HEADERS='Authorization=Basic%20YWRtaW5AZXhhbXBsZS5jb206cGFzc3dvcmQ%3D'
   pnpm dev
   ```
3. View traces and logs at `http://localhost:5080`.

### Running the End-to-End Tests with Playwright

The Playwright configuration runs `pnpm preview` on port `4173` in production mode by default. A single end-to-end test features a single full draft round.

```bash
# Ensure development-only services are spun up.
pnpm docker:dev
```

In CI, use `pnpm docker:dev:ci` so `inngest dev` can reach `pnpm preview` on port `4173`.

```bash
# Build first (required by playwright.config.js webServer command).
pnpm build
```

<details>
<summary><strong>Bash</strong></summary>

```bash
# Load only `.env` + `.env.local`
source ./scripts/test-playwright.sh

# Include `.env.development` + `.env.development.local`
source ./scripts/test-playwright.sh development

# Include `.env.production` + `.env.production.local`
source ./scripts/test-playwright.sh production
```

</details>

<details>
<summary><strong>Nushell</strong></summary>

```nu
# Load `.env` + `.env.local`
nu ./scripts/test-playwright.nu

# Include `.env.development` + `.env.development.local`
nu ./scripts/test-playwright.nu development

# Include `.env.production` + `.env.production.local`
nu ./scripts/test-playwright.nu production
```

</details>

> [!CAUTION]
> In Inngest SDK v4, local development is no longer inferred automatically. Set `INNGEST_DEV=http://localhost:8288` only for host-run app processes that should talk to the local Inngest dev server, such as `pnpm preview` during Playwright/CI and optional host-run local Inngest testing. The Docker `--sdk-url` values such as `http://host.docker.internal:5173/api/inngest` and `http://host.docker.internal:4173/api/inngest` still point the Inngest dev server back to the app's handler.

## Acknowledgements

The DRAP project, licensed under the [GNU Affero General Public License v3], was originally developed by [Sebastian Luis S. Ortiz][BastiDood], [Victor Edwin E. Reyes][VeeIsForVanana], and [Ehren A. Castillo][ehrelevant] as a service project under the [UP Center for Student Innovations]. The DRAP [logo](./static/favicon.ico) and [banner](./src/lib/banner.png) were originally designed and created by [Angelica Julianne A. Raborar][Anjellyrika].

[BastiDood]: https://github.com/BastiDood
[VeeIsForVanana]: https://github.com/VeeIsForVictor
[ehrelevant]: https://github.com/ehrelevant
[Anjellyrika]: https://github.com/Anjellyrika
[UP Center for Student Innovations]: https://up-csi.org/
[GNU Affero General Public License v3]: ./LICENSE
