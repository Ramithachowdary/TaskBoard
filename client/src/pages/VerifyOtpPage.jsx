import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const RESEND_COOLDOWN = 60;

const VerifyOtpPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === 'OTP_EXPIRED') {
        setError('Code expired. Please request a new one.');
      } else {
        setError(data?.error || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post('/auth/resend-otp', { email });
      setMessage(res.data.message);
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === 'RESEND_TOO_SOON') {
        setError('Please wait before requesting another code.');
        setCooldown(RESEND_COOLDOWN);
      } else {
        setError(data?.error || 'Could not resend code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!location.state?.email && !email) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>TaskBoard</h1>
          <h2 style={styles.subtitle}>Verify your email</h2>
          <p style={styles.hint}>Enter your email to continue.</p>
          <input
            style={styles.input}
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            style={styles.btn}
            onClick={() => setCooldown(0)}
            disabled={!email}
          >
            Continue
          </button>
          <p style={styles.backLink}><Link to="/login">← Back to login</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>TaskBoard</h1>
        <h2 style={styles.subtitle}>Check your email</h2>

        <p style={styles.hint}>
          We sent a 6-digit code to <strong>{email}</strong>.
          <br />It expires in 10 minutes.
        </p>

        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}

        <form onSubmit={handleVerify}>
          <input
            style={{
              ...styles.input,
              textAlign: 'center',
              fontSize: '2rem',
              letterSpacing: '12px',
              fontWeight: 700,
              fontFamily: 'monospace',
            }}
            type="text"
            inputMode="numeric"
            placeholder="000000"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            autoComplete="one-time-code"
            autoFocus
            required
          />
          <button
            style={{
              ...styles.btn,
              opacity: otp.length !== 6 ? 0.6 : 1,
              cursor: otp.length !== 6 ? 'not-allowed' : 'pointer',
            }}
            type="submit"
            disabled={loading || otp.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify email'}
          </button>
        </form>

        <div style={styles.resendRow}>
          <span style={styles.resendLabel}>Didn't get the code?</span>
          <button
            style={{
              ...styles.resendBtn,
              opacity: cooldown > 0 ? 0.5 : 1,
              cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
            }}
            onClick={handleResend}
            disabled={cooldown > 0 || loading}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>

        <p style={styles.backLink}><Link to="/login">← Back to login</Link></p>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' },
  card: { background: '#fff', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  title: { textAlign: 'center', fontSize: '1.8rem', fontWeight: 700, color: '#4f46e5', marginBottom: '0.25rem' },
  subtitle: { textAlign: 'center', fontSize: '1rem', color: '#666', marginBottom: '0.75rem' },
  hint: { textAlign: 'center', fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem', lineHeight: 1.6 },
  input: { display: 'block', width: '100%', padding: '0.75rem 1rem', marginBottom: '1rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' },
  btn: { width: '100%', padding: '0.75rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600 },
  error: { background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' },
  success: { background: '#dcfce7', color: '#16a34a', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' },
  resendRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem' },
  resendLabel: { color: '#6b7280', fontSize: '0.875rem' },
  resendBtn: { background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.875rem', fontWeight: 600 },
  backLink: { textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' },
};

export default VerifyOtpPage;