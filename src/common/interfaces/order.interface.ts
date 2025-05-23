import { OrderStatus, PaymentStatus } from '../enums/app.enums';

export interface IOrder {
  id: string;
  customerId: string;
  driverId?: string;
  vehicleId?: string;
  pickupAddress: IAddress;
  deliveryAddress: IAddress;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}
