export enum PasswordErrorCode {
  OK = 0,
  TOO_SHORT = 1,
  NO_NUMBER = 2,
  NO_SPECIAL_CHAR = 3,
  NO_UPPERCASE = 4,
  NO_LOWERCASE = 5,
  TOO_LONG = 6,
}

export const passwordErrorMessages: Record<PasswordErrorCode, string> = {
  [PasswordErrorCode.OK]: "Password is valid.",
  [PasswordErrorCode.TOO_SHORT]: "Password must be at least 8 characters long.",
  [PasswordErrorCode.TOO_LONG]: "Password must be less than 35 characters long.",
  [PasswordErrorCode.NO_NUMBER]: "Password must contain at least one number.",
  [PasswordErrorCode.NO_SPECIAL_CHAR]: "Password must contain at least one special character.",
  [PasswordErrorCode.NO_UPPERCASE]: "Password must contain at least one uppercase letter.",
  [PasswordErrorCode.NO_LOWERCASE]: "Password must contain at least one lowercase letter.",
};

export function validatePassword(password: string): PasswordErrorCode {
  if (password.length < 8) return PasswordErrorCode.TOO_SHORT;
  if (password.length > 35) return PasswordErrorCode.TOO_LONG;
  if (!/\d/.test(password)) return PasswordErrorCode.NO_NUMBER;
  if (!/[^A-Za-z0-9]/.test(password)) return PasswordErrorCode.NO_SPECIAL_CHAR;
  if (!/[A-Z]/.test(password)) return PasswordErrorCode.NO_UPPERCASE;
  if (!/[a-z]/.test(password)) return PasswordErrorCode.NO_LOWERCASE;

  return PasswordErrorCode.OK;
}