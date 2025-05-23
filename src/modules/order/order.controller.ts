import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdatePaymentStatusDto } from '@shared/dto/order.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';
import { Roles } from '@shared/decorators/auth.decorator';
import { UserRole } from '@common/enums/app.enums';
import { CacheInterceptor } from '@shared/interceptors/cache.interceptor';
import { LoggingInterceptor } from '@shared/interceptors/logging.interceptor';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(LoggingInterceptor)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER, UserRole.CUSTOMER)
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER)
  @UseInterceptors(CacheInterceptor)
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER, UserRole.DRIVER, UserRole.CUSTOMER)
  @UseInterceptors(CacheInterceptor)
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER, UserRole.DRIVER)
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, updateOrderStatusDto);
  }

  @Patch(':id/payment')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updatePaymentStatus(
    @Param('id') id: string,
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto,
  ) {
    return this.orderService.updatePaymentStatus(id, updatePaymentStatusDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  remove(@Param('id') id: string) {
    return this.orderService.remove(id);
  }
}
