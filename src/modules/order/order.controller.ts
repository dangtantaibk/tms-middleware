import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdatePaymentStatusDto } from '@shared/dto/order.dto';
import { LoggingInterceptor } from '@shared/interceptors/logging.interceptor';
import { TcpExceptionFilter } from '@shared/filters/tcp-exceptions.filter';
import { BaseResponse } from '@shared/interfaces/response.interface';
import { Order } from './entities/order.entity';
import { createRpcException } from '@shared/utils/exception.utils';
import { ERROR_CODES } from '@common/constants/error-codes.constants';

@Controller()
@UseInterceptors(LoggingInterceptor)
@UseFilters(TcpExceptionFilter)
export class OrderTcpController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern('order.create')
  async create(@Payload() data: { createOrderDto: CreateOrderDto; userRole: string }): Promise<BaseResponse<Order>> {
    const { createOrderDto, userRole } = data;
    
    // check user role
    const allowedRoles = ['ADMIN', 'MANAGER', 'DISPATCHER', 'CUSTOMER'];
    if (!allowedRoles.includes(userRole)) {
      throw createRpcException(
        ERROR_CODES.FORBIDDEN,
        'You do not have permission to create orders',
        { requiredRoles: allowedRoles, providedRole: userRole }
      );
    }

    const order = await this.orderService.create(createOrderDto);
    return {
      success: true,
      data: order,
      error: null,
    };
  }

  @MessagePattern('order.findAll')
  async findAll(@Payload() data: { userRole: string }): Promise<BaseResponse<Order[]>> {
    const { userRole } = data;
    
    // check user role
    const allowedRoles = ['ADMIN', 'MANAGER', 'DISPATCHER'];
    if (!allowedRoles.includes(userRole)) {
      throw createRpcException(
        ERROR_CODES.FORBIDDEN,
        'You do not have permission to view all orders',
        { requiredRoles: allowedRoles, providedRole: userRole }
      );
    }

    const orders = await this.orderService.findAll();
    return {
      success: true,
      data: orders,
      error: null,
    };
  }

  @MessagePattern('order.findOne')
  async findOne(@Payload() data: { id: string; userRole: string }): Promise<BaseResponse<Order>> {
    const { id, userRole } = data;
    
    // check user role
    const allowedRoles = ['ADMIN', 'MANAGER', 'DISPATCHER', 'DRIVER', 'CUSTOMER'];
    if (!allowedRoles.includes(userRole)) {
      throw createRpcException(
        ERROR_CODES.FORBIDDEN,
        'You do not have permission to view this order',
        { requiredRoles: allowedRoles, providedRole: userRole }
      );
    }

    const order = await this.orderService.findOne(id);
    return {
      success: true,
      data: order,
      error: null,
    };
  }

  @MessagePattern('order.updateStatus')
  async updateStatus(@Payload() data: { 
    id: string; 
    updateOrderStatusDto: UpdateOrderStatusDto; 
    userRole: string 
  }): Promise<BaseResponse<Order>> {
    const { id, updateOrderStatusDto, userRole } = data;
    
    // check user role
    const allowedRoles = ['ADMIN', 'MANAGER', 'DISPATCHER', 'DRIVER'];
    if (!allowedRoles.includes(userRole)) {
      throw createRpcException(
        ERROR_CODES.FORBIDDEN,
        'You do not have permission to update order status',
        { requiredRoles: allowedRoles, providedRole: userRole }
      );
    }

    const order = await this.orderService.updateStatus(id, updateOrderStatusDto);
    return {
      success: true,
      data: order,
      error: null,
    };
  }

  @MessagePattern('order.updatePaymentStatus')
  async updatePaymentStatus(@Payload() data: { 
    id: string; 
    updatePaymentStatusDto: UpdatePaymentStatusDto; 
    userRole: string 
  }): Promise<BaseResponse<Order>> {
    const { id, updatePaymentStatusDto, userRole } = data;
    
    // check user role
    const allowedRoles = ['ADMIN', 'MANAGER'];
    if (!allowedRoles.includes(userRole)) {
      throw createRpcException(
        ERROR_CODES.FORBIDDEN,
        'You do not have permission to update payment status',
        { requiredRoles: allowedRoles, providedRole: userRole }
      );
    }

    const order = await this.orderService.updatePaymentStatus(id, updatePaymentStatusDto);
    return {
      success: true,
      data: order,
      error: null,
    };
  }

  @MessagePattern('order.remove')
  async remove(@Payload() data: { id: string; userRole: string }): Promise<BaseResponse<{ message: string }>> {
    const { id, userRole } = data;
    
    // check user role
    const allowedRoles = ['ADMIN', 'MANAGER'];
    if (!allowedRoles.includes(userRole)) {
      throw createRpcException(
        ERROR_CODES.FORBIDDEN,
        'You do not have permission to delete orders',
        { requiredRoles: allowedRoles, providedRole: userRole }
      );
    }

    await this.orderService.remove(id);
    return {
      success: true,
      data: { message: 'Order deleted successfully' },
      error: null,
    };
  }
}