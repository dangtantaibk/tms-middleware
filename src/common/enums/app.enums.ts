export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  DISPATCHER = 'dispatcher',
  DRIVER = 'driver',
  CUSTOMER = 'customer',
}

export enum OrderStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum VehicleType {
  TRUCK = 'truck',
  VAN = 'van',
  CAR = 'car',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}
