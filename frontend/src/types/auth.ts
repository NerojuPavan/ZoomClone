export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}
