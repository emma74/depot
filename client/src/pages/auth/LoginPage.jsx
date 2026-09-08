import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import FormField from '../../components/common/FormField';
import ErrorMessage from '../../components/common/ErrorMessage';
import './LoginPage.css';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={location.state?.from || '/dashboard'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-page__card" onSubmit={handleSubmit}>
        <h1>Zongo Supermarket</h1>
        <p className="login-page__subtitle">Sign in to your account</p>

        {error && <ErrorMessage message={error} />}

        <FormField
          label="Username"
          name="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <Button type="submit" disabled={submitting} className="login-page__submit">
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="login-page__switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
        <p className="login-page__switch">
          <Link to="/">&larr; Back to home</Link>
        </p>
      </form>
    </div>
  );
}
