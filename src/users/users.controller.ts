import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
  ForbiddenException,
  Request,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserRoleDto } from "./dto/update-user-role.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../auth/enums/role.enum";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";

@ApiTags("users")
@Controller("users")
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: "Create a new user" })
  @ApiResponse({ status: 201, description: "User successfully created" })
  @ApiResponse({ status: 409, description: "Email already exists" })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)  // Use Role.ADMIN instead of 'admin'
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all users (Admin only)" })
  @ApiResponse({ status: 200, description: "Return all users" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin only" })
  findAll() {
    return this.usersService.findAll();
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "Return the current user" })
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a user by id" })
  @ApiResponse({ status: 200, description: "Return the user" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Can only access own profile or admin required" })
  async findOne(@Param("id") id: string, @Request() req) {
    // Allow users to access their own profile or admins to access any profile
    if (req.user.id !== id && !req.user.isAdmin) {
      throw new ForbiddenException("You can only access your own profile");
    }
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a user" })
  @ApiResponse({ status: 200, description: "User successfully updated" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Can only update own profile or admin required" })
  async update(
    @Param("id") id: string, 
    @Body() updateUserDto: UpdateUserDto,
    @Request() req
  ) {
    // Allow users to update their own profile or admins to update any profile
    if (req.user.id !== id && !req.user.isAdmin) {
      throw new ForbiddenException("You can only update your own profile");
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(":id/role")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)  // Use Role.ADMIN instead of 'admin'
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a user's role (Admin only)" })
  @ApiResponse({ status: 200, description: "User role successfully updated" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin only" })
  updateRole(@Param("id") id: string, @Body() updateUserRoleDto: UpdateUserRoleDto) {
    return this.usersService.updateRole(id, updateUserRoleDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a user" })
  @ApiResponse({ status: 200, description: "User successfully deleted" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Can only delete own account or admin required" })
  async remove(@Param("id") id: string, @Request() req) {
    // Allow users to delete their own account or admins to delete any account
    if (req.user.id !== id && !req.user.isAdmin) {
      throw new ForbiddenException("You can only delete your own account");
    }
    return this.usersService.remove(id);
  }
}
