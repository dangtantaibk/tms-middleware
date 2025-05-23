import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { OrderStatus, PaymentStatus } from '@common/enums/app.enums';
import { Type } from 'class-transformer';

export class AddressDto {
  @IsNotEmpty()
  @IsString()
  street: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  zipCode: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsOptional()
  latitude?: number;

  @IsOptional()
  longitude?: number;
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsNotEmpty()
  @Type(() => AddressDto)
  pickupAddress: AddressDto;

  @IsNotEmpty()
  @Type(() => AddressDto)
  deliveryAddress: AddressDto;
}

export class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

export class UpdatePaymentStatusDto {
  @IsNotEmpty()
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;
}
