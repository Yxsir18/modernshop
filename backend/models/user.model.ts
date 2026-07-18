import { User, Address } from '../../src/types';

export interface UserSchema extends User {
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpiry?: string;
  status: 'active' | 'suspended';
  lastLogin?: string;
}

export const validateUserSchema = (user: Partial<UserSchema>) => {
  if (!user.name || user.name.trim().length === 0) {
    throw new Error('Name attribute is required for full account setup.');
  }
  if (!user.email || !user.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    throw new Error('Valid email signature is required.');
  }
  if (!user.phone || !user.phone.match(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)) {
    throw new Error('Valid phone number is required.');
  }
  if (user.passwordHash && user.passwordHash.length < 6) {
    throw new Error('Password must pass the minimum security threshold.');
  }
};
