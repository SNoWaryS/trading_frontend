// Mirrors the USERS table, without the password.
export interface UserProfile {
  userId: number;
  name: string;
  surname: string;
  username: string;
  email: string;
  phoneNumber: string | null;
  address: string | null;
}
