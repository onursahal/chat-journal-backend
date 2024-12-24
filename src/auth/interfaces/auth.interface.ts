export interface CreateUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface UserCredentials {
  email: string;
  password: string;
}
