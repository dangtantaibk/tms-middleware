import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdatePaymentStatusDto } from '@shared/dto/order.dto';

@Controller()
export class OrderTcpController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern('order.create')
  async create(@Payload() data: { createOrderDto: CreateOrderDto; userRole: string }) {
    try {
      const { createOrderDto, userRole } = data;
      
      // check user role
      const allowedRoles = ['ADMIN', 'MANAGER', 'DISPATCHER', 'CUSTOMER'];
      if (!allowedRoles.includes(userRole)) {
        throw new Error('Unauthorized access');
      }

      return await this.orderService.create(createOrderDto);
    } catch (error) {
      return { error: error.message };
    }
  }

  @MessagePattern('order.findAll')
  async findAll(@Payload() data: { userRole: string }) {
    try {
      const { userRole } = data;
      
      // check user role
      const allowedRoles = ['ADMIN', 'MANAGER', 'DISPATCHER'];
      if (!allowedRoles.includes(userRole)) {
        throw new Error('Unauthorized access');
      }

      return await this.orderService.findAll();
    } catch (error) {
      return { error: error.message };
    }
  }

  @MessagePattern('order.findOne')
  async findOne(@Payload() data: { id: string; userRole: string }) {
    try {
      const { id, userRole } = data;
      
      // check user role
      const allowedRoles = ['ADMIN', 'MANAGER', 'DISPATCHER', 'DRIVER', 'CUSTOMER'];
      if (!allowedRoles.includes(userRole)) {
        throw new Error('Unauthorized access');
      }

      return await this.orderService.findOne(id);
    } catch (error) {
      return { error: error.message };
    }
  }

  @MessagePattern('order.updateStatus')
  async updateStatus(@Payload() data: { 
    id: string; 
    updateOrderStatusDto: UpdateOrderStatusDto; 
    userRole: string 
  }) {
    try {
      const { id, updateOrderStatusDto, userRole } = data;
      
      // check user role
      const allowedRoles = ['ADMIN', 'MANAGER', 'DISPATCHER', 'DRIVER'];
      if (!allowedRoles.includes(userRole)) {
        throw new Error('Unauthorized access');
      }

      return await this.orderService.updateStatus(id, updateOrderStatusDto);
    } catch (error) {
      return { error: error.message };
    }
  }

  @MessagePattern('order.updatePaymentStatus')
  async updatePaymentStatus(@Payload() data: { 
    id: string; 
    updatePaymentStatusDto: UpdatePaymentStatusDto; 
    userRole: string 
  }) {
    try {
      const { id, updatePaymentStatusDto, userRole } = data;
      
      // check user role
      const allowedRoles = ['ADMIN', 'MANAGER'];
      if (!allowedRoles.includes(userRole)) {
        throw new Error('Unauthorized access');
      }

      return await this.orderService.updatePaymentStatus(id, updatePaymentStatusDto);
    } catch (error) {
      return { error: error.message };
    }
  }

  @MessagePattern('order.remove')
  async remove(@Payload() data: { id: string; userRole: string }) {
    try {
      const { id, userRole } = data;
      
      // check user role
      const allowedRoles = ['ADMIN', 'MANAGER'];
      if (!allowedRoles.includes(userRole)) {
        throw new Error('Unauthorized access');
      }

      return await this.orderService.remove(id);
    } catch (error) {
      return { error: error.message };
    }
  }
}