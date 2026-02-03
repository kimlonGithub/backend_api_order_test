/**
 * Test script: connect to the admin WebSocket namespace and log every new_order event.
 * Run: node scripts/test-websocket-client.mjs
 * Then create an order (e.g. curl -X POST http://localhost:5000/orders -H "Content-Type: application/json" -d '{"total": 10}')
 */
import { io } from 'socket.io-client';

const BASE = process.env.API_URL || 'http://localhost:5000';
const socket = io(`${BASE}/admin`);

socket.on('connect', () => console.log('Connected to admin namespace'));
socket.on('new_order', (payload) =>
  console.log('New order:', JSON.stringify(payload, null, 2)),
);
socket.on('connect_error', (err) => console.error('Connection error:', err.message));
