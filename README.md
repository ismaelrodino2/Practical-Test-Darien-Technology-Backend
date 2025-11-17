# Challenge Backend

Node.js/TypeScript API using Express + Prisma with PostgreSQL.

## Quick Start

1. Copy `example.env` to `.env` and configure `DATABASE_URL` and `API_KEY`
2. Run migrations: `pnpm prisma:migrate`
3. Start the server: `pnpm dev`

**Or use Docker:** See [docker.md](./docker.md) for details.

## Scripts

- `pnpm dev`: Development mode
- `pnpm build`: Build for production
- `pnpm start`: Run production build

## API Endpoints

All routes require `x-api-key` header.

- `GET /locations`
- `GET/POST/PUT/DELETE /spaces`
- `GET/POST/PUT/DELETE /reservations` (supports pagination: `?page=1&pageSize=10`)

## Business Rules

- Time conflicts: same space cannot be reserved for overlapping intervals
- Weekly limit: max 3 reservations per client (email) per week
- Reservation times must be in the future

## MQTT Integration

The backend subscribes to MQTT topics using wildcards:
- `sites/+/offices/+/telemetry`
- `sites/+/offices/+/reported`
- `sites/+/offices/+/desired`

Telemetry is broadcast via WebSocket at `/telemetry?x-api-key=YOUR_KEY`.

## Running Simulator

```bash
# SITE_A
node index.js --site-id SITE_A --office-id OFFICE_1
node index.js --site-id SITE_A --office-id OFFICE_2

# SITE_B
node index.js --site-id SITE_B --office-id OFFICE_3
node index.js --site-id SITE_B --office-id OFFICE_4
```

## Testing

See [TEST.md](./TEST.md) for testing setup and instructions.

## Docker

See [docker.md](./docker.md) for Docker setup and configuration details.
