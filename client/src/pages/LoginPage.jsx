import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
  const data = err.response?.data;

  // Backend returns 403 + EMAIL_NOT_VERIFIED when user hasn't verified email
  if (data?.code === 'EMAIL_NOT_VERIFIED') {
    // Silently redirect to verify page with email prefilled
    navigate('/verify-otp', { state: { email: form.email } });
    return;
  }

  setError(data?.error || 'Login failed');
} finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>TaskBoard</h1>
        <h2 style={styles.subtitle}>Sign in</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input style={styles.input} type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input style={styles.input} type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={styles.divider}>or</div>

        <button style={styles.googleBtn} onClick={handleGoogleLogin}>
          <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" style={{ width: 18, marginRight: 8 }} />
          Sign in with Google
        </button>

        <p style={styles.link}>
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' },
  card: { background: '#fff', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  title: { textAlign: 'center', fontSize: '1.8rem', fontWeight: 700, color: '#4f46e5', marginBottom: '0.25rem' },
  subtitle: { textAlign: 'center', fontSize: '1rem', color: '#666', marginBottom: '1.5rem' },
  input: { display: 'block', width: '100%', padding: '0.75rem 1rem', marginBottom: '1rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' },
  btn: { width: '100%', padding: '0.75rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: 600 },
  googleBtn: { width: '100%', padding: '0.75rem', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.75rem' },
  divider: { textAlign: 'center', color: '#aaa', margin: '1rem 0' },
  error: { background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' },
  link: { textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' },
};

export default LoginPage;