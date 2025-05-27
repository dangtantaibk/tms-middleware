import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto, UpdateRoleDto } from '@shared/dto/role.dto';
import { CacheService } from '@infrastructure/cache/cache.service';
import { CACHE_KEYS } from '@common/constants/cache.constants';
import { createRpcException } from '@shared/utils/exception.utils';
import { ERROR_CODES } from '@common/constants/error-codes.constants';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly cacheService: CacheService,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    // Check if role already exists
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name }
    });

    if (existingRole) {
      throw createRpcException(
        ERROR_CODES.ALREADY_EXISTS,
        `Role with name '${createRoleDto.name}' already exists`,
        { name: createRoleDto.name }
      );
    }

    const role = this.roleRepository.create(createRoleDto);
    const savedRole = await this.roleRepository.save(role);
    
    // Clear cache
    await this.clearRoleCache();
    
    return savedRole;
  }

  async findAll(): Promise<Role[]> {
    const cacheKey = `${CACHE_KEYS.ROLE}all`;
    
    // Try to get from cache first
    const cachedRoles = await this.cacheService.get<Role[]>(cacheKey);
    if (cachedRoles) {
      return cachedRoles;
    }

    const roles = await this.roleRepository.find({
      relations: ['users']
    });
    
    // Cache the result
    await this.cacheService.set(cacheKey, roles);
    
    return roles;
  }

  async findOne(id: string): Promise<Role> {
    const cacheKey = `${CACHE_KEYS.ROLE}${id}`;
    
    // Try to get from cache first
    const cachedRole = await this.cacheService.get<Role>(cacheKey);
    if (cachedRole) {
      return cachedRole;
    }

    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users']
    });

    if (!role) {
      throw createRpcException(
        ERROR_CODES.NOT_FOUND,
        `Role with ID ${id} not found`,
        { id }
      );
    }
    
    // Cache the result
    await this.cacheService.set(cacheKey, role);
    
    return role;
  }

  async findByName(name: string): Promise<Role> {
    const cacheKey = `${CACHE_KEYS.ROLE}name:${name}`;
    
    // Try to get from cache first
    const cachedRole = await this.cacheService.get<Role>(cacheKey);
    if (cachedRole) {
      return cachedRole;
    }

    const role = await this.roleRepository.findOne({
      where: { name },
      relations: ['users']
    });

    if (!role) {
      throw createRpcException(
        ERROR_CODES.NOT_FOUND,
        `Role with name '${name}' not found`,
        { name }
      );
    }
    
    // Cache the result
    await this.cacheService.set(cacheKey, role);
    
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    // Check if name is being updated and if it conflicts
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name }
      });

      if (existingRole) {
        throw createRpcException(
          ERROR_CODES.ALREADY_EXISTS,
          `Role with name '${updateRoleDto.name}' already exists`,
          { name: updateRoleDto.name }
        );
      }
    }

    Object.assign(role, updateRoleDto);
    const updatedRole = await this.roleRepository.save(role);
    
    // Clear cache
    await this.clearRoleCache();
    
    return updatedRole;
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    
    // Check if role has users assigned
    if (role.users && role.users.length > 0) {
      throw createRpcException(
        ERROR_CODES.CONFLICT,
        `Cannot delete role '${role.name}' because it has users assigned`, 
        { roleId: id, roleName: role.name }
      );
    }
    
    // Check if this is a system role that cannot be deleted
    const systemRoles = ['admin', 'super-admin', 'system'];
    if (systemRoles.includes(role.name.toLowerCase())) {
      throw createRpcException(
        ERROR_CODES.CONFLICT,
        `Cannot delete system role '${role.name}'`,
        { roleId: id, roleName: role.name }
      );
    }
    
    await this.roleRepository.delete(id);
    
    // Clear cache
    await this.clearRoleCache();
  }

  async addPermissions(id: string, permissions: string[]): Promise<Role> {
    const role = await this.findOne(id);
    
    // Validate permissions format (optional)
    const validPermissions = permissions.filter(p => 
      typeof p === 'string' && p.length > 0
    );
    
    if (validPermissions.length === 0) {
      throw createRpcException(
        ERROR_CODES.BAD_REQUEST,
        'No valid permissions provided',
        { permissions }
      );
    }
    
    // Merge permissions and remove duplicates
    const currentPermissions = role.permissions || [];
    role.permissions = [...new Set([...currentPermissions, ...validPermissions])];
    
    const updatedRole = await this.roleRepository.save(role);
    
    // Clear cache
    await this.clearRoleCache();
    
    return updatedRole;
  }

  async removePermissions(id: string, permissions: string[]): Promise<Role> {
    const role = await this.findOne(id);
    
    // Remove specified permissions
    role.permissions = (role.permissions || []).filter(p => !permissions.includes(p));
    
    const updatedRole = await this.roleRepository.save(role);
    
    // Clear cache
    await this.clearRoleCache();
    
    return updatedRole;
  }

  async getUsersWithRole(roleId: string): Promise<Role> {
    const cacheKey = `${CACHE_KEYS.ROLE}${roleId}:users`;
    
    // Try to get from cache first
    const cachedRole = await this.cacheService.get<Role>(cacheKey);
    if (cachedRole) {
      return cachedRole;
    }

    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['users']
    });

    if (!role) {
      throw createRpcException(
        ERROR_CODES.NOT_FOUND,
        `Role with ID ${roleId} not found`,
        { roleId }
      );
    }

    // Cache the result
    await this.cacheService.set(cacheKey, role);

    return role;
  }

  /**
   * Get all available permissions from all roles
   */
  async getAllPermissions(): Promise<string[]> {
    const cacheKey = `${CACHE_KEYS.ROLE}all:permissions`;
    
    // Try to get from cache first
    const cachedPermissions = await this.cacheService.get<string[]>(cacheKey);
    if (cachedPermissions) {
      return cachedPermissions;
    }

    const roles = await this.roleRepository.find();
    const allPermissions = new Set<string>();
    
    roles.forEach(role => {
      if (role.permissions && Array.isArray(role.permissions)) {
        role.permissions.forEach(permission => allPermissions.add(permission));
      }
    });
    
    const permissionsArray = Array.from(allPermissions);
    
    // Cache the result
    await this.cacheService.set(cacheKey, permissionsArray);
    
    return permissionsArray;
  }

  /**
   * Get roles by permission
   */
  async getRolesByPermission(permission: string): Promise<Role[]> {
    const cacheKey = `${CACHE_KEYS.ROLE}permission:${permission}`;
    
    // Try to get from cache first
    const cachedRoles = await this.cacheService.get<Role[]>(cacheKey);
    if (cachedRoles) {
      return cachedRoles;
    }

    const roles = await this.roleRepository
      .createQueryBuilder('role')
      .where(':permission = ANY(role.permissions)', { permission })
      .getMany();
    
    // Cache the result
    await this.cacheService.set(cacheKey, roles);
    
    return roles;
  }

  /**
   * Check if role has specific permission
   */
  async hasPermission(roleId: string, permission: string): Promise<boolean> {
    const role = await this.findOne(roleId);
    return role.permissions?.includes(permission) || false;
  }

  /**
   * Set all permissions for a role (replace existing)
   */
  async setPermissions(id: string, permissions: string[]): Promise<Role> {
    const role = await this.findOne(id);
    
    // Validate and filter permissions
    const validPermissions = permissions.filter(p => 
      typeof p === 'string' && p.length > 0
    );
    
    role.permissions = [...new Set(validPermissions)]; // Remove duplicates
    
    const updatedRole = await this.roleRepository.save(role);
    
    // Clear cache
    await this.clearRoleCache();
    
    return updatedRole;
  }

  private async clearRoleCache(): Promise<void> {
    await this.cacheService.clearByPattern(`${CACHE_KEYS.ROLE}*`);
  }
}