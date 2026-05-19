import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const OAuthCallbackPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (error || !token) {
      navigate('/login?error=oauth_failed');
      return;
    }

    localStorage.setItem('token', token);

    api.get('/auth/me')
      .then(res => {
        login(token, res.data);
        navigate('/dashboard');
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login?error=oauth_failed');
      });
  }, []);

  return <div style={{ padding: '2rem', textAlign: 'center' }}>Signing you in...</div>;
};

export default OAuthCallbackPage;