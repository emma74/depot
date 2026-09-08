// Account creation guardrails. Kept intentionally simple for a small, non-technical
// user base — length + one basic rule each, no composition theater.

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 72; // bcrypt silently ignores anything past 72 bytes

// Returns an error message string, or null if the username is valid.
export function validateUsername(username) {
  if (typeof username !== 'string' || !username.trim()) {
    return 'Username is required';
  }

  const trimmed = username.trim();

  if (trimmed.length < USERNAME_MIN_LENGTH) {
    return `Username must be at least ${USERNAME_MIN_LENGTH} characters`;
  }
  if (trimmed.length > USERNAME_MAX_LENGTH) {
    return `Username must be at most ${USERNAME_MAX_LENGTH} characters`;
  }
  if (!/\d/.test(trimmed)) {
    return 'Username must include at least one number';
  }

  return null;
}

// Returns an error message string, or null if the password is valid.
// `username`, if provided, is compared case-insensitively so a password can't just be the username.
export function validatePassword(password, { username } = {}) {
  if (typeof password !== 'string' || !password) {
    return 'Password is required';
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
  }
  if (username && password.toLowerCase() === username.trim().toLowerCase()) {
    return 'Password cannot be the same as your username';
  }

  return null;
}
