import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ClaimForm from './components/ClaimForm';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import UpdatePassword from './components/UpdatePassword';

interface User {
  email: string;
  role: 'claimant' | 'admin';
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  // Check for missing Supabase keys to prevent blank screen crash
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--danger-color)' }}>Missing Supabase Credentials</h2>
        <p>Your <code>.env</code> file is empty or missing the required variables.</p>
        <p>Please add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your <code>phase3_frontend/.env</code> file and restart the development server.</p>
      </div>
    );
  }

  useEffect(() => {
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUser({
          email: session.user.email,
          role: session.user.email === 'ishamnew@gmail.com' ? 'admin' : 'claimant'
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
      }
      
      if (session?.user?.email) {
        setUser({
          email: session.user.email,
          role: session.user.email === 'ishamnew@gmail.com' ? 'admin' : 'claimant'
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (recoveryMode) {
    return <UpdatePassword onComplete={() => setRecoveryMode(false)} />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <>
      <div className="top-nav">
        <span className="top-nav-text">
          Logged in as <strong>{user.email}</strong> ({user.role})
        </span>
        <button 
          className="logout-btn" 
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>
      
      <div className="app-container">
        <header className="header">
          <h1 style={{ margin: 0 }}>TrustScore AI</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>Next-Generation Fraud Detection & Processing</p>
        </header>
        
        <div className="tab-content">
          {user.role === 'claimant' ? <ClaimForm /> : <Dashboard />}
        </div>
      </div>
    </>
  );
}

export default App;
