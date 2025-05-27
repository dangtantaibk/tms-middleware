import { AuthModule } from '@modules/auth/auth.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderTcpController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Order]),
  ],
  controllers: [
    OrderTcpController,
  ],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
