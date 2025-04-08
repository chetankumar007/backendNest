import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import { Exclude } from "class-transformer";
import * as bcrypt from "bcrypt";
import { Document } from "../../documents/entities/document.entity";
import { Role } from "../../auth/enums/role.enum";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column('text', { array: true, default: [Role.VIEWER] })
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Document, (document) => document.owner)
  documents: Document[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    // Only hash the password if it has been modified
    if (this.password) {
      // Check if the password is already hashed to avoid double hashing
      if (!this.password.startsWith('$2b$')) {
        this.password = await bcrypt.hash(this.password, 10);
      }
    }
  }

  // This will automatically remove the password when the entity is serialized
  toJSON() {
    // Create a new object without the password
    const { password, ...rest } = this;
    return rest;
  }

  // Helper method to check if user has a specific role
  hasRole(role: Role): boolean {
    return this.isAdmin || (this.roles && this.roles.includes(role));
  }
}
