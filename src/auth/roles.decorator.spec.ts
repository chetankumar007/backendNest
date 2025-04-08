import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY, Roles } from './roles.decorator';
import { Role } from './enums/role.enum';

// Mock the SetMetadata function
jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn().mockReturnValue('metadata'),
}));

describe('Roles Decorator', () => {
  it('should set the roles metadata', () => {
    // Call the Roles decorator with the actual Role enum
    const result = Roles(Role.ADMIN, Role.USER);

    // Verify that SetMetadata was called with the correct arguments
    expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, [
      Role.ADMIN,
      Role.USER,
    ]);
    // Verify that the decorator returns the result of SetMetadata
    expect(result).toBe('metadata');
  });

  it('should set empty array if no roles provided', () => {
    // Call the Roles decorator with no roles
    const result = Roles();

    // Verify that SetMetadata was called with an empty array
    expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, []);
    // Verify that the decorator returns the result of SetMetadata
    expect(result).toBe('metadata');
  });
});
