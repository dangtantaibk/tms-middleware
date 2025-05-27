import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from '@shared/dto/user.dto';
import { User } from './entities/user.entity';
import { LoggingInterceptor } from '@shared/interceptors/logging.interceptor';
import { UseInterceptors } from '@nestjs/common';
import { TcpExceptionFilter } from '@shared/filters/tcp-exceptions.filter';
import { BaseResponse } from '@shared/interfaces/response.interface';

@Controller()
@UseInterceptors(LoggingInterceptor)
@UseFilters(TcpExceptionFilter)
export class UserTcpController {
  constructor(private readonly userService: UserService) { }

  @MessagePattern('user.create')
  async createUser(@Payload() createUserDto: CreateUserDto): Promise<BaseResponse<User>> {
    const user = await this.userService.create(createUserDto);
    const { password, ...result } = user;
    return {
      success: true,
      data: result as User,
      error: null,
    };
  }

  @MessagePattern('user.findAll')
  async findAllUsers(): Promise<BaseResponse<User[]>> {
    const users = await this.userService.findAll();
    return {
      success: true,
      data: users.map(({ password, ...rest }) => rest) as User[],
      error: null,
    };
  }

  @MessagePattern('user.findById')
  async findUserById(@Payload() id: string): Promise<BaseResponse<User>> {
    const user = await this.userService.findById(id);
    const { password, ...result } = user;
    return {
      success: true,
      data: result as User,
      error: null,
    };
  }

  @MessagePattern('user.findByEmail')
  async findUserByEmail(@Payload() email: string): Promise<BaseResponse<User>> {
    const user = await this.userService.findByEmail(email);
    const { password, ...result } = user;
    return {
      success: true,
      data: result as User,
      error: null,
    };
  }

  @MessagePattern('user.update')
  async updateUser(@Payload() data: { id: string; updateUserDto: UpdateUserDto }): Promise<BaseResponse<User>> {
    const user = await this.userService.update(data.id, data.updateUserDto);
    const { password, ...result } = user;
    return {
      success: true,
      data: result as User,
      error: null,
    };
  }

  @MessagePattern('user.delete')
  async deleteUser(@Payload() id: string): Promise<BaseResponse<{ message: string }>> {
    await this.userService.remove(id);
    return {
      success: true,
      data: { message: 'User deleted successfully' },
      error: null,
    };
  }

  @MessagePattern('user.getUserPermissions')
  async getUserPermissions(@Payload() userId: string): Promise<BaseResponse<string[]>> {
    const permissions = await this.userService.getUserPermissions(userId);
    return {
      success: true,
      data: permissions,
      error: null,
    };
  }
}