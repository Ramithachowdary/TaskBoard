import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <span style={styles.logo}>TaskBoard</span>
      <div style={styles.right}>
        <span style={styles.email}>{user?.name || user?.email}</span>
        <button style={styles.btn} onClick={handleLogout}>Sign out</button>
      </div>
    </nav>
  );
};

const styles = {
  nav: { background: '#4f46e5', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { color: '#fff', fontWeight: 700, fontSize: '1.2rem' },
  right: { display: 'flex', alignItems: 'center', gap: '1rem' },
  email: { color: '#c7d2fe', fontSize: '0.875rem' },
  btn: { background: 'transparent', border: '1px solid #818cf8', color: '#fff', padding: '0.4rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' },
};

export default Navbar;