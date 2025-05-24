import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './entities/order.entity';
import { HttpClientModule } from '@infrastructure/http/http-client.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '@modules/auth/auth.module';
import { OrderTcpController } from './order.tcp.controller';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Order]),
    JwtModule.register({
      // These values should come from your config
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION },
    }),
    HttpClientModule,
  ],
  controllers: [
    OrderController,
    OrderTcpController,
  ],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
