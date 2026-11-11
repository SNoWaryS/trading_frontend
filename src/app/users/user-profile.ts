export interface UserProfile {
  userId: number;
  name: string;
  surname: string;
  username: string;
  email: string;
  phoneNumber: string | null;
  address: string | null;
}

export type PublicProfile = Pick<UserProfile, 'userId' | 'name' | 'surname' | 'username' | 'email' | 'phoneNumber'>;

export type ProfileChanges = Pick<UserProfile, 'name' | 'surname' | 'email' | 'phoneNumber' | 'address'>;

export function isValidPhoneNumber(phoneNumber: string): boolean {
  const digits = phoneNumber.replace(/\D/g, '').length;
  return /^\+?[0-9][0-9 -]*[0-9]$/.test(phoneNumber) && digits >= 9 && digits <= 15 && phoneNumber.length <= 20;
}
