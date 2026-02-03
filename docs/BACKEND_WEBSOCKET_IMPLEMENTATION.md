# Backend: Implement Endpoint with WebSocket

This doc shows the **backend code** and the **pattern** for implementing a REST endpoint that emits a WebSocket event (e.g. “new order” → notify admin).

---

## 1. Flow

```
Client  POST /orders  →  OrdersController  →  OrdersService  →  Prisma (create)
                                    │
                                    └→  OrderEventsGateway.emitNewOrder(payload)
                                                    │
                                                    └→  WebSocket: emit('new_order', payload)
```

- The **controller** handles HTTP only.
- The **service** does the business logic (e.g. create order) and then calls the **gateway** to emit.
- The **gateway** is a NestJS WebSocket gateway (Socket.IO) that broadcasts to the `admin` namespace.

---

## 2. Bootstrap: enable Socket.IO (`main.ts`)

The app must use the Socket.IO adapter so WebSocket gateways work:

```ts
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
```

---

## 3. WebSocket gateway (`order-events.gateway.ts`)

The gateway defines the **namespace** and an **emit method** that the service calls.

```ts
// src/orders/order-events.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

export interface NewOrderPayload {
  orderId: number;
  customerId: number | null;
  total: string;
  createdAt: string;
}

@WebSocketGateway({
  namespace: 'admin',
  cors: { origin: '*' },
})
export class OrderEventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  handleConnection(): void {}
  handleDisconnect(): void {}

  /** Call this from OrdersService after creating an order */
  emitNewOrder(payload: NewOrderPayload): void {
    this.server.emit('new_order', payload);
  }
}
```

- **Namespace** `admin`: only clients connecting to `/admin` receive these events.
- **Event name** for clients: `new_order`.
- **Payload**: plain object (JSON-serializable).

---

## 4. DTO for the endpoint (`create-order.dto.ts`)

```ts
// src/dto/create-order.dto.ts
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  total: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  customerId?: number;
}
```

---

## 5. Controller: REST only (`orders.controller.ts`)

The controller does **not** touch the WebSocket; it only calls the service.

```ts
// src/orders/orders.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from '../dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }
}
```

---

## 6. Service: business logic + emit (`orders.service.ts`)

The service creates the order, then calls the gateway to emit. This is the only place that ties the HTTP action to the WebSocket event.

```ts
// src/orders/orders.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderEventsGateway, NewOrderPayload } from './order-events.gateway';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderEventsGateway: OrderEventsGateway,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const order = await this.prisma.order.create({
      data: {
        total: createOrderDto.total,
        customerId: createOrderDto.customerId ?? undefined,
      },
    });

    const payload: NewOrderPayload = {
      orderId: order.id,
      customerId: order.customerId ?? null,
      total: order.total.toString(),
      createdAt: order.createdAt.toISOString(),
    };
    this.orderEventsGateway.emitNewOrder(payload);

    return order;
  }

  async findAll() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    });
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }
}
```

---

## 7. Module wiring (`orders.module.ts`)

The gateway is a **provider** in the same module as the service so the service can inject it.

```ts
// src/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderEventsGateway } from './order-events.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderEventsGateway],
})
export class OrdersModule {}
```

---

## 8. App module (`app.module.ts`)

Import the orders module so the controller and gateway are registered.

```ts
// src/app.module.ts (relevant part)
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    UsersModule,
    OrdersModule,
  ],
  // ...
})
export class AppModule {}
```

---

## 9. How to add another “endpoint + WebSocket” event

Use the same pattern:

1. **Gateway**  
   Add a new method, e.g. `emitOrderShipped(payload: OrderShippedPayload): void` and call `this.server.emit('order_shipped', payload)`.

2. **Service**  
   After the relevant business logic (e.g. updating order status), build the payload and call `this.orderEventsGateway.emitOrderShipped(payload)`.

3. **Controller**  
   Add a new endpoint (e.g. `PATCH /orders/:order_id/ship`) that calls that service method.

4. **Client**  
   Listen for the new event name (e.g. `order_shipped`) on the same Socket.IO `admin` namespace.

No changes are needed in `main.ts` or the module except ensuring the gateway that defines the new emit method is in the same module (or a shared module) as the service that calls it.

---

## 10. File summary

| File                                 | Role                                                           |
| ------------------------------------ | -------------------------------------------------------------- |
| `src/main.ts`                        | Use `IoAdapter` for Socket.IO.                                 |
| `src/orders/order-events.gateway.ts` | WebSocket server (namespace `admin`), `emitNewOrder()`.        |
| `src/orders/orders.controller.ts`    | `POST/GET /orders` → service only.                             |
| `src/orders/orders.service.ts`       | Create order, then `orderEventsGateway.emitNewOrder(payload)`. |
| `src/orders/orders.module.ts`        | Registers controller, service, gateway; imports PrismaModule.  |
| `src/dto/create-order.dto.ts`        | Validation for `POST /orders` body.                            |
| `src/app.module.ts`                  | Imports `OrdersModule`.                                        |

For testing and client usage (curl, Socket.IO client, admin panel), see [ORDERS_WEBSOCKET.md](./ORDERS_WEBSOCKET.md).
