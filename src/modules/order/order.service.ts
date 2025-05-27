import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto, UpdateOrderStatusDto, UpdatePaymentStatusDto } from '@shared/dto/order.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { createRpcException } from '@shared/utils/exception.utils';
import { ERROR_CODES } from '@common/constants/error-codes.constants';

@Injectable()
export class OrderService {
  private readonly CACHE_KEY_PREFIX = 'orders:';
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // Create a new order in the database
    const newOrder = this.orderRepository.create(createOrderDto);
    const savedOrder = await this.orderRepository.save(newOrder);
    
    // Cache the result
    await this.cacheManager.set(`${this.CACHE_KEY_PREFIX}${savedOrder.id}`, savedOrder);
    this.logger.log(`Created new order with ID: ${savedOrder.id}`);
    
    return savedOrder;
  }

  async findAll(): Promise<Order[]> {
    // Get all orders from database
    return this.orderRepository.find();
  }

  async findOne(id: string): Promise<Order> {
    // Try to get from cache first
    const cachedOrder = await this.cacheManager.get<Order>(`${this.CACHE_KEY_PREFIX}${id}`);
    if (cachedOrder) {
      return cachedOrder;
    }
    
    // If not in cache, get from database
    const order = await this.orderRepository.findOne({ where: { id } });
    
    if (!order) {
      throw createRpcException(
        ERROR_CODES.NOT_FOUND,
        `Order with ID ${id} not found`,
        { id },
      );
    }
    
    // Cache the result
    await this.cacheManager.set(`${this.CACHE_KEY_PREFIX}${id}`, order);
    
    return order;
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<Order> {
    // Find the order in database
    const order = await this.findOne(id);
    
    // Update status
    order.status = updateOrderStatusDto.status;
    
    // Save to database
    const updatedOrder = await this.orderRepository.save(order);
    
    // Update cache
    await this.cacheManager.set(`${this.CACHE_KEY_PREFIX}${id}`, updatedOrder);
    this.logger.log(`Updated status of order ${id} to ${updateOrderStatusDto.status}`);
    
    return updatedOrder;
  }

  async updatePaymentStatus(id: string, updatePaymentStatusDto: UpdatePaymentStatusDto): Promise<Order> {
    // Find the order in database
    const order = await this.findOne(id);
    
    // Update payment status
    order.paymentStatus = updatePaymentStatusDto.paymentStatus;
    
    // Save to database
    const updatedOrder = await this.orderRepository.save(order);
    
    // Update cache
    await this.cacheManager.set(`${this.CACHE_KEY_PREFIX}${id}`, updatedOrder);
    this.logger.log(`Updated payment status of order ${id} to ${updatePaymentStatusDto.paymentStatus}`);
    
    return updatedOrder;
  }

  async remove(id: string): Promise<void> {
    // Find the order in database
    const order = await this.orderRepository.findOne({ where: { id } });
    
    if (!order) {
      throw createRpcException(
        ERROR_CODES.NOT_FOUND,
        `Order with ID ${id} not found`,
        { id },
      );
    }
    
    // Remove from database
    await this.orderRepository.remove(order);
    
    // Remove from cache
    await this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${id}`);
    this.logger.log(`Removed order with ID: ${id}`);
  }
}