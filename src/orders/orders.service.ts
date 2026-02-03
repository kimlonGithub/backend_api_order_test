import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderEventsGateway, NewOrderPayload } from './order-events.gateway';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderEventsGateway: OrderEventsGateway,
  ) { }

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

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.order.delete({
      where: { id },
    });
  }
}
