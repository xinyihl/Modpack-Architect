# Modpack Architect Real-time Collaboration API

To enable instant multiplayer collaboration, the frontend requires a WebSocket-capable backend.

## 1. Connection
Clients connect via standard WebSocket (WS/WSS) protocol.
**Endpoint**: `ws://<domain>/api/v1/live` or `wss://<domain>/api/v1/live`

### Authentication
Since standard browser WebSockets do not support custom headers, authentication must be performed immediately after the connection is established.

**Initial Auth Message (Client -> Server)**:
```json
{
  "type": "AUTH",
  "username": "...",
  "password": "..."
}
```

## 2. Message Types

### State Synchronization (Bidirectional)
Whenever a change occurs, the state is broadcast to all other connected clients.

**Sync Message (JSON)**:
```json
{
  "type": "SYNC_STATE",
  "data": {
    "categories": [...],
    "resources": [...],
    "recipes": [...],
    "machines": [...]
  },
  "sender": "username",
  "timestamp": "ISO-8601"
}
```

### Heartbeat (Optional)
To keep the connection alive.
**Ping (Client -> Server)**: `{"type": "PING"}`
**Pong (Server -> Client)**: `{"type": "PONG"}`

## 3. Conflict Resolution
The server should act as the "Source of Truth". It is recommended to use **versioning** or **Last-Write-Wins (LWW)** logic on the server to prevent race conditions during high-frequency edits.