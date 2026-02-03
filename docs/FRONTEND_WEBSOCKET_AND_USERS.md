# Front-end: WebSocket + Select User

How to implement the **front-end** with **WebSocket** (admin new-order notifications) and **user selection** (place order with customer, show customer in notification, or filter by user).

---

## Overview

| Feature         | Where                   | Purpose                                                                                                          |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **WebSocket**   | Admin panel             | Connect to backend `admin` namespace, listen for `new_order`, show toast (and optionally resolve customer name). |
| **Select user** | Place-order form        | Dropdown of users (`GET /users`) → send `customerId` in `POST /orders`.                                          |
| **Select user** | Admin / new order toast | Show which customer placed the order (resolve `customerId` with `GET /users/:user_id` or cache).                 |

**Backend API used:** `GET /users`, `GET /users/:user_id`, `POST /orders`, `GET /orders`.  
**WebSocket:** Socket.IO, namespace `admin`, event `new_order`, payload `{ orderId, customerId, total, createdAt }`.

---

## 1. Prerequisites

- Backend running (e.g. `http://localhost:5000`).
- Front-end app (Next.js, React, or similar).
- Install Socket.IO client: `npm install socket.io-client`.

---

## 2. Environment variables

In the front-end project (e.g. `.env.local` for Next.js):

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
# Optional if different from API
# NEXT_PUBLIC_WS_URL=http://localhost:5000
```

Use the same base URL for REST and WebSocket if the backend serves both on one origin.

---

## 3. Shared types

Define these in your app (e.g. `types/orders.ts` or `lib/api-types.ts`):

```ts
/** Payload received on WebSocket event `new_order` */
export interface NewOrderPayload {
  orderId: number;
  customerId: number | null;
  total: string;
  createdAt: string;
}

/** User from GET /users or GET /users/:user_id */
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 4. WebSocket hook (admin panel)

Connect to the **admin** namespace and run a callback when `new_order` is received. Optionally resolve **user** so the toast can show the customer name.

### 4.1 Base hook (no user resolution)

```ts
// lib/use-admin-new-order.ts or hooks/use-admin-new-order.ts
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import type { NewOrderPayload } from '@/types/orders';

const getWsBase = () =>
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || ''
    : '';

export function useAdminNewOrderNotification(
  onNewOrder: (payload: NewOrderPayload) => void,
) {
  useEffect(() => {
    const base = getWsBase();
    if (!base) return;

    const socket = io(`${base}/admin`);
    socket.on('new_order', onNewOrder);

    return () => {
      socket.off('new_order');
      socket.disconnect();
    };
  }, [onNewOrder]);
}
```

### 4.2 With “select user” in the notification (resolve customer name)

When `customerId` is present, fetch the user so the toast can say e.g. “New order #123 from **John Doe**”.

```ts
// lib/use-admin-new-order.ts
import { useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import type { NewOrderPayload } from '@/types/orders';
import type { User } from '@/types/user';

const getWsBase = () =>
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || ''
    : '';

const API_URL =
  process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || '';

async function fetchUser(id: number): Promise<User | null> {
  try {
    const res = await fetch(`${API_URL}/users/${id}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function useAdminNewOrderNotification(
  onNewOrder: (payload: NewOrderPayload, customer: User | null) => void,
) {
  const handler = useCallback(
    async (payload: NewOrderPayload) => {
      const customer =
        payload.customerId != null ? await fetchUser(payload.customerId) : null;
      onNewOrder(payload, customer);
    },
    [onNewOrder],
  );

  useEffect(() => {
    const base = getWsBase();
    if (!base) return;

    const socket = io(`${base}/admin`);
    socket.on('new_order', handler);

    return () => {
      socket.off('new_order', handler);
      socket.disconnect();
    };
  }, [handler]);
}
```

Usage with toast (e.g. Sonner) and **selected user** in the message:

```tsx
// In layout or dashboard
import { toast } from 'sonner'; // or your toast lib
import { useAdminNewOrderNotification } from '@/lib/use-admin-new-order';
import type { NewOrderPayload } from '@/types/orders';
import type { User } from '@/types/user';

function AdminNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useAdminNewOrderNotification(
    (payload: NewOrderPayload, customer: User | null) => {
      const from = customer ? ` from ${customer.name}` : '';
      toast.info(`New order #${payload.orderId}${from}`, {
        description: `Total: $${payload.total}`,
      });
    },
  );

  return <>{children}</>;
}
```

---

## 5. Select user: place order form

Form with **total** and optional **select user** (customer). Users come from `GET /users`; submit sends `POST /orders` with optional `customerId`.

### 5.1 Fetch users for dropdown

```ts
// lib/api.ts or services/users.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_URL}/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}
```

### 5.2 Create order (POST with optional customerId)

```ts
// lib/api.ts or services/orders.ts
export interface CreateOrderInput {
  total: number;
  customerId?: number;
}

export async function createOrder(data: CreateOrderInput) {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create order');
  return res.json();
}
```

### 5.3 Place-order form component (with select user)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchUsers } from '@/lib/api';
import { createOrder } from '@/lib/api';
import type { User } from '@/types/user';

export function PlaceOrderForm() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [total, setTotal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(() => setError('Could not load users'));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const totalNum = parseFloat(total);
    if (Number.isNaN(totalNum) || totalNum < 0) {
      setError('Enter a valid total');
      return;
    }

    setLoading(true);
    try {
      await createOrder({
        total: totalNum,
        ...(selectedUserId !== '' && { customerId: selectedUserId }),
      });
      setTotal('');
      setSelectedUserId('');
      // Optional: toast.success('Order placed');
    } catch {
      setError('Failed to place order');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p role="alert">{error}</p>}
      <div>
        <label htmlFor="total">Total</label>
        <input
          id="total"
          type="number"
          min={0}
          step="0.01"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="user">Customer (optional)</label>
        <select
          id="user"
          value={selectedUserId}
          onChange={(e) =>
            setSelectedUserId(
              e.target.value === '' ? '' : Number(e.target.value),
            )
          }
        >
          <option value="">— Select user —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Placing…' : 'Place order'}
      </button>
    </form>
  );
}
```

---

## 6. Select user: filter orders (admin)

If the admin panel lists orders (`GET /orders`), you can add a **select user** dropdown and filter by customer (client-side, since the API returns orders with `customer` included).

```tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchUsers } from '@/lib/api';
import type { User } from '@/types/user';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface Order {
  id: number;
  customerId: number | null;
  total: string;
  createdAt: string;
  customer?: User | null;
}

export function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');

  useEffect(() => {
    fetch(`${API_URL}/orders`)
      .then((r) => r.json())
      .then(setOrders);
    fetchUsers().then(setUsers);
  }, []);

  const filteredOrders =
    selectedUserId === ''
      ? orders
      : orders.filter((o) => o.customerId === selectedUserId);

  return (
    <>
      <div>
        <label htmlFor="filter-user">Filter by customer</label>
        <select
          id="filter-user"
          value={selectedUserId}
          onChange={(e) =>
            setSelectedUserId(
              e.target.value === '' ? '' : Number(e.target.value),
            )
          }
        >
          <option value="">All customers</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <ul>
        {filteredOrders.map((o) => (
          <li key={o.id}>
            Order #{o.id} — ${o.total} —{' '}
            {o.customer ? o.customer.name : 'Guest'} — {o.createdAt}
          </li>
        ))}
      </ul>
    </>
  );
}
```

---

## 7. File structure (suggestion)

```
your-frontend/
├── .env.local                    # NEXT_PUBLIC_API_URL, optional NEXT_PUBLIC_WS_URL
├── types/
│   ├── orders.ts                 # NewOrderPayload
│   └── user.ts                   # User
├── lib/
│   ├── use-admin-new-order.ts    # WebSocket hook (with or without user resolution)
│   └── api.ts                    # fetchUsers, createOrder, etc.
├── components/
│   ├── PlaceOrderForm.tsx        # Form with total + select user
│   ├── OrdersList.tsx            # List + filter by user
│   └── AdminNotificationProvider.tsx  # Wraps app, uses useAdminNewOrderNotification + toast
└── app/
    └── layout.tsx                # Wrap with AdminNotificationProvider if admin app
```

---

## 8. Summary

| Task                               | Implementation                                                                                                                   |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **WebSocket in admin**             | `useAdminNewOrderNotification`: connect to `${API_URL}/admin`, listen for `new_order`, call callback (e.g. toast).               |
| **Show user in notification**      | In the callback, if `payload.customerId` is set, fetch `GET /users/:user_id` and pass user into the callback; use name in toast. |
| **Select user when placing order** | `GET /users` → dropdown; on submit `POST /orders` with `{ total, customerId? }`.                                                 |
| **Select user to filter orders**   | `GET /orders` (includes `customer`); dropdown of users from `GET /users`; filter list by `order.customerId === selectedUserId`.  |

Backend API and WebSocket details: [ORDERS_WEBSOCKET.md](./ORDERS_WEBSOCKET.md). Backend code: [BACKEND_WEBSOCKET_IMPLEMENTATION.md](./BACKEND_WEBSOCKET_IMPLEMENTATION.md).
