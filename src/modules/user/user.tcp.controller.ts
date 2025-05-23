import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from '@shared/dto/user.dto';
import { User } from './entities/user.entity';

@Controller()
export class UserTcpController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('user.create')
  async createUser(@Payload() createUserDto: CreateUserDto): Promise<User> {
    const user = await this.userService.create(createUserDto);
    const { password, ...result } = user;
    return result as User;
  }

  @MessagePattern('user.findAll')
  async findAllUsers(): Promise<User[]> {
    const users = await this.userService.findAll();
    return users.map(({ password, ...rest }) => rest) as User[];
  }

  @MessagePattern('user.findById')
  async findUserById(@Payload() id: string): Promise<User> {
    const user = await this.userService.findById(id);
    const { password, ...result } = user;
    return result as User;
  }

  @MessagePattern('user.findByEmail')
  async findUserByEmail(@Payload() email: string): Promise<User> {
    const user = await this.userService.findByEmail(email);
    const { password, ...result } = user;
    return result as User;
  }

  @MessagePattern('user.update')
  async updateUser(@Payload() data: { id: string; updateUserDto: UpdateUserDto }): Promise<User> {
    const user = await this.userService.update(data.id, data.updateUserDto);
    const { password, ...result } = user;
    return result as User;
  }

  @MessagePattern('user.delete')
  async deleteUser(@Payload() id: string): Promise<{ message: string }> {
    await this.userService.remove(id);
    return { message: 'User deleted successfully' };
  }

  @MessagePattern('user.getUserPermissions')
  async getUserPermissions(@Payload() userId: string): Promise<string[]> {
    return await this.userService.getUserPermissions(userId);
  }
}