# DRAP: Draft Ranking Automated Processor

Welcome to DRAP: the Draft Ranking Automated Processor for the [University of the Philippines] [Diliman] - [Department of Computer Science]'s yearly draft of research lab assignments. In a nutshell, this web application automates the mechanics of the draft:

[University of the Philippines]: https://up.edu.ph/
[Diliman]: https://upd.edu.ph/
[Department of Computer Science]: https://dcs.upd.edu.ph/

1. All participating students register for the draft by providing their full name, email, student number, and lab rankings (ordered by preference) to the draft administrators.
1. The regular draft process begins. For each round in the draft:
   1. Draft administrators notify (typically via email) the lab heads about all of the students that have chosen their respective research lab as the first choice.
   1. Each lab selects a subset (i.e., possibly none, some, or all) of these first-choice students to accept them into the lab. After this point, the selected students are considered to be "drafted" and are thus no longer part of the next rounds.
   1. The next round begins when all of the labs have submitted their preferences. This time around, the second-choice preferences of the remaining students are evaluated (and so on).
1. Should there be students remaining by the end of the regular draft process, the lottery round begins.
1. Before the randomization stage, draft administrators first negotiate with participating labs (that have remaining slots) to check if any of the labs would like to accept some of the remaining students immediately.
1. After manual negotiation and intervention, the remaining students are shuffled and assigned to participating labs in a round-robin fashion.
1. The draft concludes when all registered participants have been assigned to a lab.

## Development

The [main web application](./src) is powered by SvelteKit. Data persistence is backed by PostgreSQL.

### Server Environment Variables

At runtime, the server requires the following environment variables to be present.

| **Variable**                 | **Description**                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| `DRIZZLE_DEBUG`              | Enables verbose logs from Drizzle queries.                                           |
| `GOOGLE_OAUTH_CLIENT_ID`     | OAuth 2.0 credentials retrieved from the [Google Cloud Console].                     |
| `GOOGLE_OAUTH_CLIENT_SECRET` | OAuth 2.0 credentials retrieved from the [Google Cloud Console].                     |
| `GOOGLE_OAUTH_REDIRECT_URI`  | OAuth 2.0 credentials retrieved from the [Google Cloud Console].                     |
| `JOB_CONCURRENCY`            | Configures the maximum number of concurrent jobs that the email worker will consume. |
| `POSTGRES_URL`               | The connection string to the PostgreSQL instance.                                    |
| `REDIS_URL`                  | The connection URL of the Redis instance to which BullMQ will persist its queue.     |

[Google Cloud Console]: https://console.cloud.google.com/

> [!IMPORTANT]
> The `GOOGLE_OAUTH_REDIRECT_URI` must point to `/oauth/callback/`.

The following variables are optional in development, but _highly_ recommended in the production environment for [OpenTelemetry](#opentelemetry-instrumentation) integration. The standard environment variables are supported, such as (but not limited to):

| **Name**                      | **Description**                                                                         | **Recommended**                                                |
| ----------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | The base OTLP endpoint URL for exporting logs, metrics, and traces.                     | `http://localhost:5080/api/default`                            |
| `OTEL_EXPORTER_OTLP_HEADERS`  | Extra percent-encoded HTTP headers used for exporting telemetry (e.g., authentication). | `Authorization=Basic%20YWRtaW5AZXhhbXBsZS5jb206cGFzc3dvcmQ%3D` |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | The underlying exporter protocol (e.g., JSON, Protobufs, gRPC, etc.).                   | `http/protobuf`                                                |

> [!NOTE]
> The "recommended" values are only applicable to the development environment with OpenObserve running in the background. See the [`compose.yaml`] for more details on the OpenObserve configuration.

[`compose.yaml`]: ./compose.yaml

### Setting up the Codebase

```bash
# Install dependencies.
pnpm install

# Check formatting.
pnpm fmt

# Apply formatting auto-fix.
pnpm fmt:fix
```

### Linting the Codebase

```bash
# Check linting rules.
pnpm lint:eslint
pnpm lint:svelte

# Perform all lints in parallel.
pnpm lint
```

### Running the Development Server

```bash
# Run all database and queue services in the background.
docker compose --profile dev up --detach

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
# Or, just use Docker for everything.
docker compose --profile prod up --detach
```

### Local Telemetry with OpenObserve

To enable full observability in local development:

1. Start the local services (including OpenObserve):
   ```bash
   docker compose up --detach
   ```
2. Export the OTEL environment variables before running the dev server:
   ```bash
   export OTEL_EXPORTER_OTLP_ENDPOINT='http://localhost:5080/api/default'
   export OTEL_EXPORTER_OTLP_HEADERS='Authorization=Basic%20YWRtaW5AZXhhbXBsZS5jb206cGFzc3dvcmQ%3D'
   export OTEL_EXPORTER_OTLP_PROTOCOL='http/protobuf'
   pnpm dev
   ```
3. View traces and logs at `http://localhost:5080`.

## Acknowledgements

The DRAP project, licensed under the [GNU Affero General Public License v3], was originally developed by [Sebastian Luis S. Ortiz][BastiDood], [Victor Edwin E. Reyes][VeeIsForVanana], and [Ehren A. Castillo][ehrelevant] as a service project under the [UP Center for Student Innovations]. The DRAP [logo](./static/favicon.ico) and [banner](./src/lib/banner.png) were originally designed and created by [Angelica Julianne A. Raborar][Anjellyrika].

[BastiDood]: https://github.com/BastiDood
[VeeIsForVanana]: https://github.com/VeeIsForVictor
[ehrelevant]: https://github.com/ehrelevant
[Anjellyrika]: https://github.com/Anjellyrika
[UP Center for Student Innovations]: https://up-csi.org/
[GNU Affero General Public License v3]: ./LICENSE
