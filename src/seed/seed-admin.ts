import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { Role } from '../auth/enums/role.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const usersService = app.get(UsersService);

    // Check if admin user already exists
    const existingAdmin = await usersService.findByEmail('admin@example.com');

    if (!existingAdmin) {
      console.log('Creating admin user...');

      // Create admin user
      const admin = await usersService.create({
        email: 'admin@example.com',
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'User',
      });

      // Update roles to include ADMIN
      await usersService.updateRoles(admin.id, [Role.ADMIN, Role.VIEWER]);

      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');

      // Ensure admin has admin role
      if (!existingAdmin.isAdmin) {
        await usersService.updateRoles(existingAdmin.id, [
          Role.ADMIN,
          Role.VIEWER,
        ]);
        console.log('Updated existing user to admin role');
      }
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
