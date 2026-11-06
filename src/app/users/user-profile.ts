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

// What other users may see about a seller: email and phone number so buyers can contact them.
// The address stays private.
export type PublicProfile = Pick<UserProfile, 'userId' | 'name' | 'surname' | 'username' | 'email' | 'phoneNumber'>;

// The details a user may change themselves. The username stays fixed because other records point to it.
export type ProfileChanges = Pick<UserProfile, 'name' | 'surname' | 'email' | 'phoneNumber' | 'address'>;
