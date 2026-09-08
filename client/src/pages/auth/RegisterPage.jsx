import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import FormField from '../../components/common/FormField';
import ErrorMessage from '../../components/common/ErrorMessage';
import { validateUsername, validatePassword, USERNAME_HINT, PASSWORD_HINT } from '../../utils/validation';
import './LoginPage.css';

export default function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameError, setUsernameError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const usernameMessage = validateUsername(username);
    const passwordMessage = validatePassword(password, { username });
    setUsernameError(usernameMessage);
    setPasswordError(passwordMessage);
    if (usernameMessage || passwordMessage) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await register(username.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-page__card" onSubmit={handleSubmit}>
        <h1>Zongo Supermarket</h1>
        <p className="login-page__subtitle">Create your account</p>

        {error && <ErrorMessage message={error} />}

        <FormField
          label="Username"
          name="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          hint={USERNAME_HINT}
          error={usernameError}
          required
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          hint={PASSWORD_HINT}
          error={passwordError}
          required
        />
        <FormField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
        />

        <Button type="submit" disabled={submitting} className="login-page__submit">
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="login-page__switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
