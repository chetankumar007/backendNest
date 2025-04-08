import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Make the decorator accept any enum type
export function Roles<T>(...roles: T[]): MethodDecorator & ClassDecorator {
  return SetMetadata(ROLES_KEY, roles);
}
