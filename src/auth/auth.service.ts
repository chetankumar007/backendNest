import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  // In-memory token blacklist
  // In production, use Redis or another persistent store
  private tokenBlacklist: Set<string> = new Set();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    if (!plainPassword || !hashedPassword) {
      return false;
    }
    
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Password comparison error:', error.message);
      return false;
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    if (!email || !password) {
      return null;
    }
    
    // Find user by email
    const user = await this.usersService.findOneByEmail(email);
    
    // If user doesn't exist, return null
    if (!user) {
      return null;
    }
    
    // Validate password
    const isPasswordValid = await this.validatePassword(password, user.password);
    
    if (isPasswordValid) {
      // Don't return the password
      const { password, ...result } = user;
      return result;
    }
    
    return null;
  }

  async login(loginDto: LoginDto) {
    if (!loginDto) {
      throw new UnauthorizedException('Login data is required');
    }
    
    const { email, password } = loginDto;
    
    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }
    
    // Find user by email
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await this.validatePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;
    
    return this.generateTokenResponse(userWithoutPassword);
  }
  
  private generateTokenResponse(user: any) {
    if (!user || !user.id) {
      throw new UnauthorizedException('Invalid user data for token generation');
    }
    
    // Create JWT payload
    const payload = { 
      email: user.email, 
      sub: user.id,
      userId: user.id,
      isAdmin: user.isAdmin || false
    };
    
    // Return token and user info
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        isAdmin: user.isAdmin || false
      }
    };
  }

  async register(registerDto: RegisterDto) {
    if (!registerDto || !registerDto.email || !registerDto.password) {
      throw new UnauthorizedException('Email and password are required for registration');
    }
    
    try {
      // Check if user already exists
      const existingUser = await this.usersService.findOneByEmail(registerDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
      
      // Create the user with the password
      const user = await this.usersService.create({
        ...registerDto,
        isAdmin: false,
      });

      if (!user) {
        throw new Error('User creation failed');
      }

      // Return the user without password
      const { password, ...result } = user;
      return {
        message: 'User registered successfully',
        user: result
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async logout(user: any, token: string) {
    try {
      // Add the token to the blacklist
      if (token) {
        this.invalidateToken(token);
      }
      
      return { 
        message: 'Logout successful',
        userId: user.id
      };
    } catch (error) {
      throw new UnauthorizedException('Logout failed');
    }
  }

  async getProfile(userId: string) {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }
    
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    const { password, ...result } = user;
    return result;
  }

  // For token validation
  validateToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }
    
    try {
      // Check if token is blacklisted
      if (this.tokenBlacklist.has(token)) {
        throw new UnauthorizedException('Token has been invalidated');
      }
      
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  // Add token to blacklist
  invalidateToken(token: string) {
    if (!token) {
      return;
    }
    
    // Extract the token from Bearer format if needed
    const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;
    this.tokenBlacklist.add(tokenValue);
    
    // In a real application, you would set an expiration time 
    // equal to the token's remaining lifetime in a persistent store
  }
}
