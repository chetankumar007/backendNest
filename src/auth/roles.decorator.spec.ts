import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Roles } from './roles.decorator';
import { Role } from '../enums/role.enum';

describe('Roles Decorator', () => {
  it('should set the correct metadata with the provided roles', () => {
    // Create a test class with a method decorated with @Roles
    class TestController {
      @Roles(Role.ADMIN, Role.USER)
      testMethod() {}
    }

    // Create a reflector instance
    const reflector = new Reflector();

    // Get the metadata from the method
    const roles = reflector.get(ROLES_KEY, TestController.prototype.testMethod);

    // Assert that the roles metadata is set correctly
    expect(roles).toBeDefined();
    expect(roles).toEqual([Role.ADMIN, Role.USER]);
  });

  it('should set empty array if no roles provided', () => {
    // Create a test class with a method decorated with empty @Roles
    class TestController {
      @Roles()
      testMethod() {}
    }

    // Create a reflector instance
    const reflector = new Reflector();

    // Get the metadata from the method
    const roles = reflector.get(ROLES_KEY, TestController.prototype.testMethod);

    // Assert that the roles metadata is an empty array
    expect(roles).toBeDefined();
    expect(roles).toEqual([]);
  });
});
