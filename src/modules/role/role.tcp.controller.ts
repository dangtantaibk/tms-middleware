import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RoleService } from './role.service';
import { CreateRoleDto, UpdateRoleDto } from '@shared/dto/role.dto';
import { Role } from './entities/role.entity';

@Controller()
export class RoleTcpController {
  constructor(private readonly roleService: RoleService) {}

  @MessagePattern('role.create')
  async createRole(@Payload() createRoleDto: CreateRoleDto): Promise<Role> {
    const role = await this.roleService.create(createRoleDto);
    const { users, ...result } = role;
    return result as Role;
  }

  @MessagePattern('role.findAll')
  async findAllRoles(): Promise<Role[]> {
    const roles = await this.roleService.findAll();
    return roles.map(({ users, ...rest }) => rest) as Role[];
  }

  @MessagePattern('role.findById')
  async findRoleById(@Payload() id: string): Promise<Role> {
    const role = await this.roleService.findOne(id);
    const { users, ...result } = role;
    return result as Role;
  }

  @MessagePattern('role.findByName')
  async findRoleByName(@Payload() name: string): Promise<Role> {
    const role = await this.roleService.findByName(name);
    const { users, ...result } = role;
    return result as Role;
  }

  @MessagePattern('role.update')
  async updateRole(@Payload() data: { id: string; updateRoleDto: UpdateRoleDto }): Promise<Role> {
    const role = await this.roleService.update(data.id, data.updateRoleDto);
    const { users, ...result } = role;
    return result as Role;
  }

  @MessagePattern('role.delete')
  async deleteRole(@Payload() id: string): Promise<{ message: string }> {
    await this.roleService.remove(id);
    return { message: 'Role deleted successfully' };
  }

  @MessagePattern('role.addPermissions')
  async addPermissions(@Payload() data: { id: string; permissions: string[] }): Promise<Role> {
    const role = await this.roleService.addPermissions(data.id, data.permissions);
    const { users, ...result } = role;
    return result as Role;
  }

  @MessagePattern('role.removePermissions')
  async removePermissions(@Payload() data: { id: string; permissions: string[] }): Promise<Role> {
    const role = await this.roleService.removePermissions(data.id, data.permissions);
    const { users, ...result } = role;
    return result as Role;
  }

  @MessagePattern('role.getUsersWithRole')
  async getUsersWithRole(@Payload() roleId: string): Promise<any> {
    const role = await this.roleService.getUsersWithRole(roleId);
    return {
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
    };
  }
}