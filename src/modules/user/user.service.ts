import { Injectable, NotFoundException, ConflictException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '@shared/dto/user.dto';
import { CacheService } from '@infrastructure/cache/cache.service';
import { CACHE_KEYS } from '@common/constants/cache.constants';
import * as bcrypt from 'bcrypt';
import { TcpClientService } from '@infrastructure/tcp/tcp.service';
import { TCP_PATTERNS } from '@common/constants/cache.constants';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly cacheService: CacheService,
    @Optional() private tcpClientService?: TcpClientService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new ConflictException(`User with email '${createUserDto.email}' already exists`);
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
      throw new NotFoundException(`User with ID ${id} not found`);
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
      throw new NotFoundException(`User with email ${email} not found`);
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
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if email is being updated and if it conflicts
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email }
      });

      if (existingUser) {
        throw new ConflictException(`User with email '${updateUserDto.email}' already exists`);
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
        throw new ConflictException('Cannot delete the last admin user');
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
      throw new NotFoundException('User not found');
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new ConflictException('Current password is incorrect');
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
      throw new NotFoundException(`Roles not found: ${missingIds.join(', ')}`);
    }

    return roles;
  }

  private async clearUserCache(): Promise<void> {
    await this.cacheService.clearByPattern(`${CACHE_KEYS.USER}*`);
  }
}