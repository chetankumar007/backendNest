import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({ example: "john.doe@example.com", description: "User email address" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "Password123!", description: "User password" })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: "John", description: "User first name" })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: "Doe", description: "User last name" })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: false, description: "Admin status" })
  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;
}
