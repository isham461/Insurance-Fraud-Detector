import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface UpdatePasswordProps {
    onComplete: () => void;
}

const UpdatePassword: React.FC<UpdatePasswordProps> = ({ onComplete }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            
            setSuccessMsg('Password updated successfully!');
            setTimeout(() => {
                onComplete();
            }, 2000);
        } catch (error: any) {
            setErrorMsg(error.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Set New Password</h2>
                
                {errorMsg && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', textAlign: 'center' }}>{errorMsg}</div>}
                {successMsg && <div style={{ color: 'var(--success-color)', marginBottom: '1rem', textAlign: 'center' }}>{successMsg}</div>}

                <form onSubmit={handleUpdate}>
                    <div className="form-group">
                        <label>New Password</label>
                        <input 
                            type="password" 
                            className="form-control" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                        />
                    </div>
                    <button type="submit" className="btn" style={{ width: '100%', marginBottom: '1rem' }} disabled={loading}>
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UpdatePassword;
