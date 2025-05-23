import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto, UpdateOrderStatusDto, UpdatePaymentStatusDto } from '@shared/dto/order.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { HttpClientService } from '@infrastructure/http/http-client.service';

@Injectable()
export class OrderService {
  private readonly CACHE_KEY_PREFIX = 'orders:';

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private httpClient: HttpClientService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // First try to forward to TMS backend
    try {
      const backendResponse = await this.httpClient.post<any>('/orders', createOrderDto);
      
      // Create a local copy for caching purposes
      const newOrder = this.orderRepository.create({
        ...createOrderDto,
        id: backendResponse.id,
        status: backendResponse.status,
        paymentStatus: backendResponse.paymentStatus,
        totalAmount: backendResponse.totalAmount,
      });
      
      const savedOrder = await this.orderRepository.save(newOrder);
      
      // Cache the result
      await this.cacheManager.set(`${this.CACHE_KEY_PREFIX}${savedOrder.id}`, savedOrder);
      
      return savedOrder;
    } catch (error) {
      // If backend is unavailable, create order locally
      const newOrder = this.orderRepository.create(createOrderDto);
      return this.orderRepository.save(newOrder);
    }
  }

  async findAll(): Promise<Order[]> {
    // Try from backend first
    try {
      const backendOrders = await this.httpClient.get<any[]>('/orders');
      return backendOrders;
    } catch (error) {
      // Fallback to local database
      return this.orderRepository.find();
    }
  }

  async findOne(id: string): Promise<Order> {
    // Try from cache first
    const cachedOrder = await this.cacheManager.get<Order>(`${this.CACHE_KEY_PREFIX}${id}`);
    if (cachedOrder) {
      return cachedOrder;
    }
    
    // Try from backend
    try {
      const backendOrder = await this.httpClient.get<Order>(`/orders/${id}`);
      
      // Cache the result
      await this.cacheManager.set(`${this.CACHE_KEY_PREFIX}${id}`, backendOrder);
      
      return backendOrder;
    } catch (error) {
      // Fallback to local database
      const order = await this.orderRepository.findOne({ where: { id } });
      
      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
      
      return order;
    }
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<Order> {
    // Try to update in backend
    try {
      const backendOrder = await this.httpClient.put<Order>(
        `/orders/${id}/status`,
        updateOrderStatusDto,
      );
      
      // Update local copy
      const order = await this.findOne(id);
      order.status = updateOrderStatusDto.status;
      await this.orderRepository.save(order);
      
      // Update cache
      await this.cacheManager.set(`${this.CACHE_KEY_PREFIX}${id}`, {
        ...order,
        status: updateOrderStatusDto.status,
      });
      
      return backendOrder;
    } catch (error) {
      // Fallback to local update
      const order = await this.findOne(id);
      order.status = updateOrderStatusDto.status;
      return this.orderRepository.save(order);
    }
  }

  async updatePaymentStatus(id: string, updatePaymentStatusDto: UpdatePaymentStatusDto): Promise<Order> {
    // Try to update in backend
    try {
      const backendOrder = await this.httpClient.put<Order>(
        `/orders/${id}/payment`,
        updatePaymentStatusDto,
      );
      
      // Update local copy
      const order = await this.findOne(id);
      order.paymentStatus = updatePaymentStatusDto.paymentStatus;
      await this.orderRepository.save(order);
      
      // Update cache
      await this.cacheManager.set(`${this.CACHE_KEY_PREFIX}${id}`, {
        ...order,
        paymentStatus: updatePaymentStatusDto.paymentStatus,
      });
      
      return backendOrder;
    } catch (error) {
      // Fallback to local update
      const order = await this.findOne(id);
      order.paymentStatus = updatePaymentStatusDto.paymentStatus;
      return this.orderRepository.save(order);
    }
  }

  async remove(id: string): Promise<void> {
    // Try to delete in backend
    try {
      await this.httpClient.delete(`/orders/${id}`);
      
      // Delete local copy
      const order = await this.orderRepository.findOne({ where: { id } });
      if (order) {
        await this.orderRepository.remove(order);
      }
      
      // Remove from cache
      await this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${id}`);
    } catch (error) {
      // Mark as deleted locally
      const order = await this.orderRepository.findOne({ where: { id } });
      if (order) {
        await this.orderRepository.remove(order);
        await this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${id}`);
      }
    }
  }
}
