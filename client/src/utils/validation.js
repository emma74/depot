// Mirrors server/src/utils/validators.js so users get instant feedback without a
// round trip — the server remains the authoritative check.

export const USERNAME_HINT = 'At least 3 characters, including a number';
export const PASSWORD_HINT = 'At least 6 characters';

const USERNAME_MIN_LENGTH = 3;
const PASSWORD_MIN_LENGTH = 6;

// Returns an error message string, or null if the username is valid.
export function validateUsername(username) {
  const trimmed = (username || '').trim();

  if (!trimmed) return 'Username is required';
  if (trimmed.length < USERNAME_MIN_LENGTH) {
    return `Username must be at least ${USERNAME_MIN_LENGTH} characters`;
  }
  if (!/\d/.test(trimmed)) {
    return 'Username must include at least one number';
  }

  return null;
}

// Returns an error message string, or null if the password is valid.
export function validatePassword(password, { username } = {}) {
  if (!password) return 'Password is required';
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (username && password.toLowerCase() === username.trim().toLowerCase()) {
    return 'Password cannot be the same as your username';
  }

  return null;
}
