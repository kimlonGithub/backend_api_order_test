import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

/** Payload sent to admin clients when a new order is created */
export interface NewOrderPayload {
  orderId: number;
  customerId: number | null;
  total: string;
  createdAt: string;
}

/**
 * WebSocket gateway for admin notifications.
 * Admin panel connects to namespace /admin; only clients in this namespace
 * receive new_order events (e.g. wss://api.example.com/admin with Socket.IO client).
 */
@WebSocketGateway({
  namespace: 'admin',
  cors: { origin: '*' },
})
export class OrderEventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(): void {
    // Optional: log or authenticate admin client
  }

  handleDisconnect(): void {
    // Optional: cleanup
  }

  /**
   * Emit new_order to all connected admin clients. Call this from OrdersService
   * after an order is created.
   */
  emitNewOrder(payload: NewOrderPayload): void {
    this.server.emit('new_order', payload);
  }
}
