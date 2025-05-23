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
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from '@shared/dto/user.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';
import { Roles } from '@shared/decorators/auth.decorator';
import { UserRole } from '@common/enums/app.enums';
import { CacheInterceptor } from '@shared/interceptors/cache.interceptor';
import { LoggingInterceptor } from '@shared/interceptors/logging.interceptor';
import { User } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(LoggingInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    const user = await this.userService.create(createUserDto);
    const { password, ...result } = user;
    return result as User;
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(CacheInterceptor)
  async findAll(): Promise<User[]> {
    const users = await this.userService.findAll();
    return users.map(({ password, ...rest }) => rest) as User[];
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(CacheInterceptor)
  async findOne(@Param('id') id: string): Promise<User> {
    const user = await this.userService.findById(id);
    const { password, ...result } = user;
    return result as User;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.userService.update(id, updateUserDto);
    const { password, ...result } = user;
    return result as User;
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.userService.remove(id);
    return { message: 'User deleted successfully' };
  }
}
