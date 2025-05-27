import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RoleService } from './role.service';
import { CreateRoleDto, UpdateRoleDto } from '@shared/dto/role.dto';
import { Role } from './entities/role.entity';
import { LoggingInterceptor } from '@shared/interceptors/logging.interceptor';
import { TcpExceptionFilter } from '@shared/filters/tcp-exceptions.filter';
import { BaseResponse } from '@shared/interfaces/response.interface';

@Controller()
@UseInterceptors(LoggingInterceptor)
@UseFilters(TcpExceptionFilter)
export class RoleTcpController {
  constructor(private readonly roleService: RoleService) {}

  @MessagePattern('role.create')
  async createRole(@Payload() createRoleDto: CreateRoleDto): Promise<BaseResponse<Role>> {
    const role = await this.roleService.create(createRoleDto);
    const { users, ...result } = role;
    return {
      success: true,
      data: result as Role,
      error: null,
    };
  }

  @MessagePattern('role.findAll')
  async findAllRoles(): Promise<BaseResponse<Role[]>> {
    const roles = await this.roleService.findAll();
    return {
      success: true,
      data: roles.map(({ users, ...rest }) => rest) as Role[],
      error: null,
    };
  }

  @MessagePattern('role.findById')
  async findRoleById(@Payload() id: string): Promise<BaseResponse<Role>> {
    const role = await this.roleService.findOne(id);
    const { users, ...result } = role;
    return {
      success: true,
      data: result as Role,
      error: null,
    };
  }

  @MessagePattern('role.findByName')
  async findRoleByName(@Payload() name: string): Promise<BaseResponse<Role>> {
    const role = await this.roleService.findByName(name);
    const { users, ...result } = role;
    return {
      success: true,
      data: result as Role,
      error: null,
    };
  }

  @MessagePattern('role.update')
  async updateRole(@Payload() data: { id: string; updateRoleDto: UpdateRoleDto }): Promise<BaseResponse<Role>> {
    const role = await this.roleService.update(data.id, data.updateRoleDto);
    const { users, ...result } = role;
    return {
      success: true,
      data: result as Role,
      error: null,
    };
  }

  @MessagePattern('role.delete')
  async deleteRole(@Payload() id: string): Promise<BaseResponse<{ message: string }>> {
    await this.roleService.remove(id);
    return {
      success: true,
      data: { message: 'Role deleted successfully' },
      error: null,
    };
  }

  @MessagePattern('role.addPermissions')
  async addPermissions(@Payload() data: { id: string; permissions: string[] }): Promise<BaseResponse<Role>> {
    const role = await this.roleService.addPermissions(data.id, data.permissions);
    const { users, ...result } = role;
    return {
      success: true,
      data: result as Role,
      error: null,
    };
  }

  @MessagePattern('role.removePermissions')
  async removePermissions(@Payload() data: { id: string; permissions: string[] }): Promise<BaseResponse<Role>> {
    const role = await this.roleService.removePermissions(data.id, data.permissions);
    const { users, ...result } = role;
    return {
      success: true,
      data: result as Role,
      error: null,
    };
  }

  @MessagePattern('role.getUsersWithRole')
  async getUsersWithRole(@Payload() roleId: string): Promise<BaseResponse<{
    role: {
      id: string;
      name: string;
      description: string;
    },
    users: Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      isActive: boolean;
    }>
  }>> {
    const role = await this.roleService.getUsersWithRole(roleId);
    return {
      success: true,
      data: {
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
        },
        users: role.users.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
        })),
      },
      error: null,
    };
  }
}