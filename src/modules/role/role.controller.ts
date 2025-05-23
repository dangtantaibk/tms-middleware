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
import { RoleService } from './role.service';
import { 
  CreateRoleDto, 
  UpdateRoleDto, 
  AddPermissionsDto, 
  RemovePermissionsDto,
  RoleResponseDto 
} from '@shared/dto/role.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';
import { Roles } from '@shared/decorators/auth.decorator';
import { UserRole } from '@common/enums/app.enums';
import { CacheInterceptor } from '@shared/interceptors/cache.interceptor';
import { LoggingInterceptor } from '@shared/interceptors/logging.interceptor';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(LoggingInterceptor)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    const role = await this.roleService.create(createRoleDto);
    const { users, ...result } = role;
    return result as RoleResponseDto;
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(CacheInterceptor)
  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.roleService.findAll();
    return roles.map(({ users, ...rest }) => rest) as RoleResponseDto[];
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(CacheInterceptor)
  async findOne(@Param('id') id: string): Promise<RoleResponseDto> {
    const role = await this.roleService.findOne(id);
    const { users, ...result } = role;
    return result as RoleResponseDto;
  }

  @Get('name/:name')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(CacheInterceptor)
  async findByName(@Param('name') name: string): Promise<RoleResponseDto> {
    const role = await this.roleService.findByName(name);
    const { users, ...result } = role;
    return result as RoleResponseDto;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    const role = await this.roleService.update(id, updateRoleDto);
    const { users, ...result } = role;
    return result as RoleResponseDto;
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.roleService.remove(id);
    return { message: 'Role deleted successfully' };
  }

  @Post(':id/permissions')
  @Roles(UserRole.ADMIN)
  async addPermissions(
    @Param('id') id: string,
    @Body() addPermissionsDto: AddPermissionsDto,
  ): Promise<RoleResponseDto> {
    const role = await this.roleService.addPermissions(id, addPermissionsDto.permissions);
    const { users, ...result } = role;
    return result as RoleResponseDto;
  }

  @Delete(':id/permissions')
  @Roles(UserRole.ADMIN)
  async removePermissions(
    @Param('id') id: string,
    @Body() removePermissionsDto: RemovePermissionsDto,
  ): Promise<RoleResponseDto> {
    const role = await this.roleService.removePermissions(id, removePermissionsDto.permissions);
    const { users, ...result } = role;
    return result as RoleResponseDto;
  }

  @Get(':id/users')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(CacheInterceptor)
  async getUsersWithRole(@Param('id') id: string) {
    const role = await this.roleService.getUsersWithRole(id);
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