import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

type AuthMode = 'login' | 'signup' | 'forgot_password';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<AuthMode>('login');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setSuccessMsg('Check your email for the confirmation link! (If email confirmations are enabled)');
            } else if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // If successful, App.tsx will detect the session change
            } else if (mode === 'forgot_password') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin
                });
                if (error) throw error;
                setSuccessMsg('Password reset link sent! Please check your email.');
            }
        } catch (error: any) {
            setErrorMsg(error.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>TrustScore AI Authentication</h2>
                
                {errorMsg && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', textAlign: 'center' }}>{errorMsg}</div>}
                {successMsg && <div style={{ color: 'var(--success-color)', marginBottom: '1rem', textAlign: 'center' }}>{successMsg}</div>}

                <form onSubmit={handleAuth}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            className="form-control" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    
                    {mode !== 'forgot_password' && (
                        <div className="form-group">
                            <label>Password</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                    )}

                    <button type="submit" className="btn" style={{ width: '100%', marginBottom: '1rem' }} disabled={loading}>
                        {loading ? 'Processing...' : (
                            mode === 'signup' ? 'Sign Up' : 
                            mode === 'login' ? 'Sign In' : 
                            'Send Reset Link'
                        )}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {mode === 'login' && (
                        <button 
                            type="button" 
                            onClick={() => { setMode('forgot_password'); setErrorMsg(null); setSuccessMsg(null); }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            Forgot Password?
                        </button>
                    )}
                    
                    <button 
                        type="button" 
                        onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setErrorMsg(null); setSuccessMsg(null); }}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        {mode === 'signup' ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                    
                    {mode === 'forgot_password' && (
                        <button 
                            type="button" 
                            onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', marginTop: '0.5rem' }}
                        >
                            Back to Sign In
                        </button>
                    )}
                </div>

                <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '0.5rem' }}>
                        <strong>Evaluator / Demo Access:</strong><br/>
                        Email: <code>demo1234@gmail.com</code><br/>
                        Password: <code>123456</code>
                    </p>
                    <button 
                        type="button" 
                        className="btn" 
                        style={{ width: '100%', background: '#f3f4f6', color: '#374151', padding: '0.6rem' }}
                        onClick={async () => {
                            setLoading(true);
                            setErrorMsg(null);
                            const { error } = await supabase.auth.signInWithPassword({
                                email: 'demo1234@gmail.com',
                                password: '123456',
                            });
                            if (error) {
                                setErrorMsg(error.message);
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                    >
                        Auto-Login as Demo User
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
