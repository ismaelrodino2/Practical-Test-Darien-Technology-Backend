# Challenge Backend

Node.js/TypeScript API that follows a lightweight MVC structure, using Express + Prisma with a Supabase-hosted PostgreSQL database.

## Requirements

- Node.js 18+
- Supabase account (or any reachable PostgreSQL instance)

## Setup

1. Copy the sample env file:
   ```bash
   cp example.env .env
   ```
2. Paste the Supabase `DATABASE_URL` (Project Settings → Database → Connection string → URI) into `.env`.
3. Configure an `API_KEY` value in `.env`. The same value must be used by every client when calling the API.
4. Set `MQTT_URL` if you are running the IoT simulator on a different host/port (defaults to `mqtt://localhost:1883`).
5. Change `PORT` if you need another port (defaults to `3009` so the backend stays off the common `3000` frontend port).

## Scripts

- `npm run dev`: run the API in development mode via `ts-node`.
- `npm run build`: emit compiled files into `dist`.
- `npm start`: run the compiled build.
- `npm run prisma:generate`: regenerate Prisma Client.
- `npm run prisma:migrate`: apply pending migrations (requires DB access).
- `npm run lint`: type-check the project.

## Database

1. Configure Supabase or another Postgres instance and update `.env`.
2. Create/update migrations:
   ```bash
   npm run prisma:migrate --name init
   ```

## Domain model & business rules

- `Location`: a building or site with coordinates that can host multiple spaces.
- `Space`: a rentable unit within a location (capacity, optional reference, description).
- `Reservation`: a client's request to book a space on a certain date/time window.
- Time conflicts are blocked: the same space cannot be reserved for overlapping intervals.
- Each client (email) can have **at most 3 active reservations per week** (Monday 00:00 → Sunday 23:59 UTC).
- Reservation times (`reservationAt`, `startsAt`, `endsAt`) must be in the future.

See `prisma/schema.prisma` for relationships and indexes.

## Main endpoints (`/api`)

- `GET /locations`
- `GET/POST/PUT/DELETE /spaces`
- `GET/POST/PUT/DELETE /reservations`
  - `GET /reservations?page=1&pageSize=10` supports pagination and returns `{ data, meta }`.

All responses use JSON and share the same validation/error format defined by the global middlewares.

## Authentication

All `/api` routes are protected by an API key middleware. Every request must include the header `x-api-key` with the same value configured in your `.env`.

Example request:

```bash
curl -X GET http://localhost:3009/api/spaces \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY"
```

## MQTT Simulator Integration (Step 1)

This project now includes the minimal wiring needed to consume the telemetry published by the Darien IoT simulator.

1. **Start the local broker (from the `iot-simulator` project):**
   ```bash
   cd ../iot-simulator
   docker compose -f docker.compose.yml up -d
   ```
2. **Run one simulator instance (still inside `iot-simulator`):**
   ```bash
   node index.js --site-id SITE_A --office-id OFFICE_1
   ```
   You can launch multiple instances with different IDs if needed.
3. **Boot the backend subscriber (from `challenge-backend`):**
   ```bash
   pnpm dev
   ```
4. **Verify logs:** the backend subscribes to `sites/SITE_A/offices/OFFICE_1/telemetry` and prints incoming JSON payloads as `Telemetry received: ...`. If you stop the broker, the MQTT client automatically attempts to reconnect using the `MQTT_URL` configured in your `.env`.

## Docker

### Production

Build the optimized image (uses `npm ci`, Prisma generate, `npm run build`, and prunes dev dependencies) and run it via Docker Compose:

```bash
docker compose up --build
```

The service listens on `PORT` (defaults to `3009`). Ensure `.env` contains valid `DATABASE_URL` and optional `PORT`.

### Development

Use `docker-compose.dev.yml` with the development image (`Dockerfile.dev`) to get hot reload via `npm run dev`/`nodemon`, mounting your local source tree:

```bash
docker compose -f docker-compose.dev.yml up --build
```

This setup mounts the workspace into `/app` and keeps `/app/node_modules` inside the container, so local edits trigger automatic restarts without reinstalling dependencies. The default exposed port is `3009`, so the backend stays separate from a frontend running on `3000`.


## Running the IoT Simulator

This project uses external IDs to map the simulator to the database.

### Locations
- SITE_A → Location “Edifício Central”
- SITE_B → Location “Unidade Norte”

### Spaces
- OFFICE_1 → Sala Reunião A1
- OFFICE_2 → Sala Reunião A2
- OFFICE_3 → Coworking B1
- OFFICE_4 → Sala Privativa B2

### How to run the simulator

SITE_A:
    node index.js --site-id SITE_A --office-id OFFICE_1
    node index.js --site-id SITE_A --office-id OFFICE_2

SITE_B:
    node index.js --site-id SITE_B --office-id OFFICE_3
    node index.js --site-id SITE_B --office-id OFFICE_4
