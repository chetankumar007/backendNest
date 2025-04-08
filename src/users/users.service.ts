import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../auth/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if password is provided
    if (!createUserDto.password) {
      throw new BadRequestException('Password is required');
    }

    // Check if user with this email already exists
    const existingUser = await this.findOneByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash the password with salt
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
      
    // Create a new user entity using repository.create
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      roles: [Role.VIEWER], // Default role
    });

    // Save the user
    const savedUser = await this.usersRepository.save(user);
    
    // Return user without password
    const { password, ...result } = savedUser;
    return result as User;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findOneWithPasswordByEmail(email);
    
    if (!user) {
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    // Return user without password
    const { password: _, ...result } = user;
    return result as User;
  }

  async findAll(role?: string): Promise<User[]> {
    let users: User[];
    
    if (role) {
      users = await this.usersRepository.createQueryBuilder('user')
        .where(':role = ANY(user.roles)', { role })
        .getMany();
    } else {
      users = await this.usersRepository.find();
    }
    
    // Remove passwords from the response
    return users.map(user => {
      const { password, ...result } = user;
      return result as User;
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // Remove password from the response
    const { password, ...result } = user;
    return result as User;
  }

  async findOneByEmail(email: string, includePassword = false): Promise<User | null> {
    if (!email) {
      return null;
    }
    
    if (includePassword) {
      // Explicitly select the password field
      return this.usersRepository
        .createQueryBuilder('user')
        .where('user.email = :email', { email })
        .addSelect('user.password')
        .getOne();
    }
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.findOneByEmail(email);
    
    if (!user) {
      return null; // Return null instead of throwing an exception for flexibility
    }
    
    return user;
  }

  async validateCredentials(email: string, password: string): Promise<boolean> {
    const user = await this.findOneWithPasswordByEmail(email);
    
    if (!user) {
      return false;
    }
    
    return bcrypt.compare(password, user.password);
  }

  // Method to find user with password for authentication
  async findOneWithPasswordByEmail(email: string): Promise<User | null> {
    return this.findOneByEmail(email, true);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // First check if user exists
    await this.findOne(id);
    
    // Create a copy of the DTO to avoid modifying the original
    const updatedFields = { ...updateUserDto };
    
    // If password is being updated, hash it with salt
    if (updatedFields.password) {
      const salt = await bcrypt.genSalt();
      updatedFields.password = await bcrypt.hash(updatedFields.password, salt);
    }
    
    // Update with the new data
    await this.usersRepository.update(id, updatedFields);
    
    // Return updated user without password
    return this.findOne(id);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    // Get user with password
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id: userId })
      .addSelect('user.password')
      .getOne();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return false;
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user.password = hashedPassword;
    await this.usersRepository.save(user);
    
    return true;
  }

  async updateRole(id: string, updateUserRoleDto: UpdateUserRoleDto): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // Update role properties
    Object.assign(user, updateUserRoleDto);
    
    await this.usersRepository.save(user);
    
    // Return user without password
    return this.findOne(id);
  }
  
  async updateRoles(id: string, roles: Role[]): Promise<User> {
    // Check if user exists
    const user = await this.findOne(id);
    
    // Update roles
    user.roles = roles;
    
    // If user has ADMIN role, also set isAdmin flag
    user.isAdmin = roles.includes(Role.ADMIN);
    
    // Save updated user
    await this.usersRepository.save(user);
    
    // Return updated user directly
    const { password, ...result } = user;
    return result as User;
  }
  
  async addRole(id: string, role: Role): Promise<User> {
    const user = await this.findOne(id);
    
    // Add role if it doesn't exist already
    if (!user.roles.includes(role)) {
      user.roles.push(role);
      
      // If adding ADMIN role, set isAdmin flag
      if (role === Role.ADMIN) {
        user.isAdmin = true;
      }
      
      await this.usersRepository.save(user);
    }
    
    // Return user without password
    return this.findOne(id);
  }
  
  async removeRole(id: string, role: Role): Promise<User> {
    const user = await this.findOne(id);
    
    // Remove role if it exists
    user.roles = user.roles.filter(r => r !== role);
    
    // If removing ADMIN role, update isAdmin flag
    if (role === Role.ADMIN) {
      user.isAdmin = user.roles.includes(Role.ADMIN);
    }
    
    await this.usersRepository.save(user);
    
    // Return user without password
    return this.findOne(id);
  }
  
  async hasRole(id: string, role: Role): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user.roles.includes(role);
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.usersRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return { message: `User with ID ${id} has been deleted` };
  }
}
