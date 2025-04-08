import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '../../auth/enums/role.enum';

export class UpdateUserRolesDto {
  @ApiProperty({
    description: 'User roles',
    enum: Role,
    isArray: true,
    example: [Role.EDITOR, Role.VIEWER],
  })
  @IsArray()
  @IsEnum(Role, { each: true })
  @IsNotEmpty()
  roles: Role[];
}
