# Orders API & WebSocket – Test & Usage

How to run, test, and use the **Orders API** and the **admin WebSocket** that notifies when a new order is created.

- **Backend implementation (code + pattern):** [BACKEND_WEBSOCKET_IMPLEMENTATION.md](./BACKEND_WEBSOCKET_IMPLEMENTATION.md).
- **Front-end (WebSocket + select user):** [FRONTEND_WEBSOCKET_AND_USERS.md](./FRONTEND_WEBSOCKET_AND_USERS.md).

---

## Quick test (2 terminals)

1. **Terminal 1:** start backend and WebSocket listener

   ```bash
   npm run start:dev
   ```

   In a second terminal: `npm run test:ws` (keeps running and prints every `new_order`).

2. **Terminal 2:** create an order
   ```bash
   curl -X POST http://localhost:5000/orders -H "Content-Type: application/json" -d '{"total": 29.99}'
   ```
   Terminal 1 (test:ws) should print the `new_order` payload.

---

## Overview

| What           | Description                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Orders API** | `POST /orders` (create), `GET /orders` (list), `GET /orders/:order_id` (get one).                                              |
| **WebSocket**  | Socket.IO **admin** namespace. Backend emits `new_order` after each created order.                                             |
| **Flow**       | Front-end calls `POST /orders` → Backend creates order → Backend emits `new_order` → Admin clients receive and show a message. |

---

## Prerequisites

1. **Database**
   - PostgreSQL running and `DATABASE_URL` set in `.env`.
   - Orders table must exist. If you haven’t run the orders migration yet:

   ```bash
   npx prisma migrate dev --name add_orders
   ```

2. **Backend**
   - Dependencies installed: `npm install`
   - Prisma client generated: `npm run prisma:generate` (or run after `migrate dev`)

---

## Running the backend

```bash
npm run start:dev
```

Default: HTTP on `http://localhost:5000`, Socket.IO on the same host (e.g. `http://localhost:5000`).

---

## 1. Testing the Orders API

Base URL: `http://localhost:5000` (or your `PORT` from `.env`).

### Create an order (POST)

```bash
curl -X POST http://localhost:5000/orders \
  -H "Content-Type: application/json" \
  -d '{"total": 29.99}'
```

With optional customer:

```bash
curl -X POST http://localhost:5000/orders \
  -H "Content-Type: application/json" \
  -d '{"total": 49.50, "customerId": 1}'
```

**Example response (201):**

```json
{
  "id": 1,
  "customerId": null,
  "total": "29.99",
  "createdAt": "2025-02-03T12:00:00.000Z"
}
```

### List orders (GET)

```bash
curl http://localhost:5000/orders
```

### Get one order (GET)

```bash
curl http://localhost:5000/orders/1
```

---

## 2. Testing the WebSocket (admin `new_order` event)

The backend uses **Socket.IO**. The admin channel is the **`admin`** namespace.

### Option A: Browser console (quick check)

1. Start the backend: `npm run start:dev`.
2. Open your admin app (or any page) in the browser.
3. Load Socket.IO client from CDN and connect to the **admin** namespace:

```html
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
<script>
  const socket = io('http://localhost:5000/admin');
  socket.on('connect', () => console.log('Connected to admin namespace'));
  socket.on('new_order', (payload) => {
    console.log('New order:', payload);
    // payload: { orderId, customerId, total, createdAt }
  });
</script>
```

4. In another tab or with curl, create an order: `curl -X POST http://localhost:5000/orders -H "Content-Type: application/json" -d '{"total": 99.99}'`.
5. In the browser console you should see `New order: { orderId, customerId, total, createdAt }`.

### Option B: Node script (listener)

Create a file `scripts/test-websocket-client.mjs`:

```javascript
import { io } from 'socket.io-client';

const BASE = process.env.API_URL || 'http://localhost:5000';
const socket = io(`${BASE}/admin`);

socket.on('connect', () => console.log('Connected to admin namespace'));
socket.on('new_order', (payload) =>
  console.log('New order:', JSON.stringify(payload, null, 2)),
);
socket.on('connect_error', (err) =>
  console.error('Connection error:', err.message),
);
```

Run (from project root; `socket.io-client` is a devDependency):

```bash
npm run test:ws
```

Keep this running, then in another terminal create an order:

```bash
curl -X POST http://localhost:5000/orders -H "Content-Type: application/json" -d '{"total": 12.50}'
```

You should see the `new_order` payload in the first terminal.

### Option C: Postman

1. New request → **WebSocket**.
2. URL: `ws://localhost:5000/socket.io/?EIO=4&transport=websocket` (Socket.IO handshake).
3. Postman’s raw WebSocket works for the upgrade; for **namespaces** and event names you may need to use a small Node or browser script as above. Prefer Option A or B for reliable testing.

---

## 3. Using it in the admin panel (Next.js / React)

### Environment

Add the API (and optional WebSocket base URL) in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
# Optional: if different from API origin
# NEXT_PUBLIC_WS_URL=http://localhost:5000
```

### Connect and listen

- **URL:** same origin as the API, e.g. `process.env.NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_WS_URL`.
- **Namespace:** `admin` (path segment `/admin` with Socket.IO).
- **Event:** `new_order`.
- **Payload:** `{ orderId: number, customerId: number | null, total: string, createdAt: string }`.

Example hook (install `socket.io-client` in the admin app):

```ts
import { useEffect } from 'react';
import { io } from 'socket.io-client';

const WS_BASE =
  process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || '';

export function useAdminNewOrderNotification(
  onNewOrder: (payload: NewOrderPayload) => void,
) {
  useEffect(() => {
    if (!WS_BASE) return;
    const socket = io(`${WS_BASE}/admin`);
    socket.on('new_order', onNewOrder);
    return () => {
      socket.off('new_order');
      socket.disconnect();
    };
  }, [WS_BASE, onNewOrder]);
}

export interface NewOrderPayload {
  orderId: number;
  customerId: number | null;
  total: string;
  createdAt: string;
}
```

Usage: call `useAdminNewOrderNotification((payload) => toast.info(\`New order #${payload.orderId}\`, { description: `Total: $${payload.total}` }))` from your layout or dashboard.

---

## 4. Summary

| Action                          | How                                                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create order                    | `POST /orders` with `{ "total": number, "customerId"?: number }`.                                                                                    |
| List orders                     | `GET /orders`.                                                                                                                                       |
| Get one order                   | `GET /orders/:order_id`.                                                                                                                             |
| Receive new-order notifications | Connect to Socket.IO **admin** namespace, listen for event **`new_order`**, use payload `{ orderId, customerId, total, createdAt }` for toast/badge. |

All of the above assumes the backend is running and the orders migration has been applied.
