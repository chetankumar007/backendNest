import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Role } from '../../auth/enums/role.enum';

export class UpdateUserRoleDto {
  @ApiProperty({
    example: true,
    description: 'Whether the user is an admin',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;

  @ApiProperty({
    enum: Role,
    example: Role.EDITOR,
    description: 'The role of the user',
    required: false,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
