import { UserRole } from '@common/enums/app.enums';
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
export const Public = () => SetMetadata('isPublic', true);
