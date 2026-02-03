import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from '../dto/create-order.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an order (emits WebSocket new_order to admin)' })
  @ApiResponse({ status: 201, description: 'Order created.' })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all orders' })
  @ApiResponse({ status: 200, description: 'List of orders (includes customer).' })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':order_id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'order_id', type: Number, description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order found.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  findOne(@Param('order_id', ParseIntPipe) order_id: number) {
    return this.ordersService.findOne(order_id);
  }

  @Delete(':order_id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an order' })
  @ApiParam({ name: 'order_id', type: Number, description: 'Order ID' })
  @ApiResponse({ status: 204, description: 'Order deleted.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  remove(@Param('order_id', ParseIntPipe) order_id: number) {
    return this.ordersService.remove(order_id);
  }
}
