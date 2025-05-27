import { CACHE_KEYS } from '@common/constants/cache.constants';
import { CacheService } from '@infrastructure/cache/cache.service';
import { Injectable } from '@nestjs/common';
// import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto, UpdateUserDto } from '@shared/dto/user.dto';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { createRpcException } from '@shared/utils/exception.utils';
import { ERROR_CODES } from '@common/constants/error-codes.constants';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly cacheService: CacheService,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw createRpcException(
        ERROR_CODES.ALREADY_EXISTS,
        `User with email '${createUserDto.email}' already exists`,
        { email: existingUser.email }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Extract roleIds from DTO
    const { roleIds, ...userProperties } = createUserDto;

    // Create user instance with basic properties
    const user = this.usersRepository.create({
      ...userProperties,
      password: hashedPassword,
    });

    // Assign roles if provided
    if (roleIds && Array.isArray(roleIds)) {
      user.roles = await this.getRoleEntities(roleIds);
    }

    // Save user with relationships
    const savedUser = await this.usersRepository.save(user);

    // Clear cache
    await this.clearUserCache();

    return savedUser;
  }

  async findAll(): Promise<User[]> {
    const cacheKey = `${CACHE_KEYS.USER}all`;

    // Try to get from cache first
    const cachedUsers = await this.cacheService.get<User[]>(cacheKey);
    if (cachedUsers) {
      return cachedUsers;
    }

    const users = await this.usersRepository.find({
      relations: ['roles']
    });

    // Cache the result
    await this.cacheService.set(cacheKey, users);

    return users;
  }

  async findById(id: string): Promise<User> {
    const cacheKey = `${CACHE_KEYS.USER}${id}`;

    // Try to get from cache first
    const cachedUser = await this.cacheService.get<User>(cacheKey);
    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles']
    });

    if (!user) {
      throw createRpcException(
        ERROR_CODES.NOT_FOUND,
        `User with ID ${id} not found`,
        { id }
      );
    }

    // Cache the result
    await this.cacheService.set(cacheKey, user);

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const cacheKey = `${CACHE_KEYS.USER_BY_EMAIL}${email}`;

    // Try to get from cache first
    const cachedUser = await this.cacheService.get<User>(cacheKey);
    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['roles']
    });

    if (!user) {
      throw createRpcException(
        ERROR_CODES.NOT_FOUND,
        `User with email '${email}' not found`,
        { email }
      );
    }

    // Cache the result
    await this.cacheService.set(cacheKey, user);

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles']
    });

    if (!user) {
      throw createRpcException(
        ERROR_CODES.NOT_FOUND,
        `User with ID ${id} not found`,
        { id }
      );
    }

    // Check if email is being updated and if it conflicts
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email }
      });

      if (existingUser) {
        throw createRpcException(
          ERROR_CODES.ALREADY_EXISTS,
          `User with email '${updateUserDto.email}' already exists`,
          { email: existingUser.email }
        );
      }
    }

    // Handle password update if needed
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Handle basic properties (excluding roles)
    const { roleIds, ...userProperties } = updateUserDto;

    // Update basic properties
    Object.assign(user, userProperties);

    // Handle roles if provided
    if (roleIds && Array.isArray(roleIds)) {
      user.roles = await this.getRoleEntities(roleIds);
    }

    // Save the updated user with relationships
    const updatedUser = await this.usersRepository.save(user);

    // Clear cache
    await this.clearUserCache();

    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);

    // Check if user has critical roles that prevent deletion
    const adminRoles = user.roles?.filter(role =>
      ['admin', 'super-admin'].includes(role.name.toLowerCase())
    );

    if (adminRoles && adminRoles.length > 0) {
      // Check if this is the last admin user
      const adminCount = await this.usersRepository
        .createQueryBuilder('user')
        .innerJoin('user.roles', 'role')
        .where('role.name IN (:...roleNames)', { roleNames: ['admin', 'super-admin'] })
        .andWhere('user.id != :userId', { userId: id })
        .getCount();

      if (adminCount === 0) {
        throw createRpcException(
          ERROR_CODES.CANNOT_DELETE_LAST_ADMIN,
          'Cannot delete the last admin user',
          { userId: id }
        );
      }
    }

    await this.usersRepository.delete(id);
    await this.clearUserCache();
  }

  /**
   * Get all permissions associated with a user
   * @param userId The ID of the user
   * @returns Array of permission strings
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const cacheKey = `${CACHE_KEYS.USER}${userId}:permissions`;

    // Try to get from cache first
    const cachedPermissions = await this.cacheService.get<string[]>(cacheKey);
    if (cachedPermissions) {
      return cachedPermissions;
    }

    // Get the user with roles relationship
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      return [];
    }

    // Extract unique permissions from all roles
    const permissions = new Set<string>();

    // Loop through user roles and collect all permissions
    for (const role of user.roles) {
      if (role.permissions && Array.isArray(role.permissions)) {
        for (const permission of role.permissions) {
          permissions.add(permission);
        }
      }
    }

    const permissionsArray = Array.from(permissions);

    // Cache the result
    await this.cacheService.set(cacheKey, permissionsArray);

    return permissionsArray;
  }

  /**
   * Validate user credentials for authentication
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.usersRepository.findOne({
        where: { email },
        relations: ['roles']
      });

      if (!user || !user.isActive) {
        return null;
      }

      if (!user.password || !password) {
        return null;
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        return user;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw createRpcException(
        ERROR_CODES.NOT_FOUND,
        `User with ID ${userId} not found`,
        { userId }
      );
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw createRpcException(
        ERROR_CODES.INVALID_CREDENTIALS,
        'Current password is incorrect',
        { userId }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.usersRepository.update(userId, { password: hashedPassword });

    // Clear cache
    await this.clearUserCache();
  }

  /**
   * Activate or deactivate user
   */
  async toggleUserStatus(userId: string, isActive: boolean): Promise<User> {
    const user = await this.findById(userId);

    user.isActive = isActive;
    const updatedUser = await this.usersRepository.save(user);

    // Clear cache
    await this.clearUserCache();

    return updatedUser;
  }

  /**
   * Get users by role
   */
  async getUsersByRole(roleName: string): Promise<User[]> {
    const cacheKey = `${CACHE_KEYS.USER}role:${roleName}`;

    // Try to get from cache first
    const cachedUsers = await this.cacheService.get<User[]>(cacheKey);
    if (cachedUsers) {
      return cachedUsers;
    }

    const users = await this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('role.name = :roleName', { roleName })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getMany();

    // Cache the result
    await this.cacheService.set(cacheKey, users);

    return users;
  }

  // Helper method to get role entities by IDs
  private async getRoleEntities(roleIds: string[]): Promise<any[]> {
    if (!roleIds.length) return [];

    const roles = await this.usersRepository.manager.findBy('Role', {
      id: In(roleIds),
    });

    if (roles.length !== roleIds.length) {
      const foundIds = roles.map(role => role.id);
      const missingIds = roleIds.filter(id => !foundIds.includes(id));
      throw createRpcException(
        ERROR_CODES.ROLES_NOT_FOUND,
        `Roles not found: ${missingIds.join(', ')}`,
        { missingIds }
      );
    }

    return roles;
  }

  private async clearUserCache(): Promise<void> {
    await this.cacheService.clearByPattern(`${CACHE_KEYS.USER}*`);
  }
}