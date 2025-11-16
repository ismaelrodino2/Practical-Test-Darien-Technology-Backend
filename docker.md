# Docker Commands to run:

**Production:**
```bash
docker compose build
docker compose up
```

**Development (with hot reload):**
```bash
docker compose -f docker-compose.dev.yml up --build
```

## .env Configuration

**When running in Docker:**
```env
MQTT_URL=mqtt://mosquitto:1883
```

**When running locally (without Docker):**
```env
MQTT_URL=mqtt://localhost:1883
```
