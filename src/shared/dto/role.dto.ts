import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

export class AddPermissionsDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}

export class RemovePermissionsDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}

export class RoleResponseDto {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
  createdAt: Date;
  updatedAt: Date;
}