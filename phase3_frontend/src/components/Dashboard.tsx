import { useEffect, useState } from 'react';

interface ClaimUpdate {
    event: string;
    id: number;
    claimant_name: string;
    incident_type: string;
    claimed_amount: number;
    status: string;
    fraud_score?: number;
    risk_level?: string;
    reason_flags?: string[];
    extracted_receipt_amount?: number;
    evidence_url?: string;
}

const Dashboard: React.FC = () => {
    const [updates, setUpdates] = useState<ClaimUpdate[]>([]);
    const [connectionStatus, setConnectionStatus] = useState('Connecting...');
    const [selectedClaim, setSelectedClaim] = useState<ClaimUpdate | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        const fetchClaims = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/v1/claims`);
                if (res.ok) {
                    const data: ClaimUpdate[] = await res.json();
                    // Sort descending by ID just in case
                    data.sort((a, b) => b.id - a.id);
                    setUpdates(data);
                }
            } catch (err) {
                console.error("Failed to fetch initial claims:", err);
            }
        };
        fetchClaims();

        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
        const ws = new WebSocket(`${wsUrl}/api/v1/ws/dashboard`);
        
        ws.onopen = () => setConnectionStatus('Connected');
        ws.onclose = () => setConnectionStatus('Disconnected');
        ws.onerror = () => setConnectionStatus('Error');

        ws.onmessage = (event) => {
            try {
                const data: ClaimUpdate = JSON.parse(event.data);
                if (data.event === "NEW_CLAIM") {
                    setUpdates(prev => [data, ...prev]);
                }
            } catch (err) {
                console.error("Failed to parse WebSocket message:", err);
            }
        };

        return () => ws.close();
    }, []);

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/v1/claims/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setUpdates(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
                setSelectedClaim(null);
            } else {
                alert('Failed to update status');
            }
        } catch (err) {
            console.error(err);
            alert('Error updating status');
        }
    };

    const filteredUpdates = updates.filter(u => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = u.claimant_name.toLowerCase().includes(searchLower) || u.id.toString().includes(searchLower);
        if (!matchesSearch) return false;

        if (activeFilter === 'Critical Risk (>80%)') return u.fraud_score !== undefined && u.fraud_score > 80;
        if (activeFilter === 'Pending Review') return u.status === 'PROCESSING';
        if (activeFilter === 'Approved') return u.status === 'APPROVED';
        if (activeFilter === 'Rejected') return u.status === 'REJECTED';
        return true;
    });

    const filters = ['All', 'Critical Risk (>80%)', 'Pending Review', 'Approved', 'Rejected'];

    return (
        <div className="card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Adjuster Dashboard</h2>
                <span className={`status-badge ${connectionStatus.toLowerCase()}`}>
                    {connectionStatus}
                </span>
            </div>

            <div className="filters-bar">
                <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Search by Claimant Name or ID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {filters.map(filter => (
                    <button 
                        key={filter}
                        className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
                        onClick={() => setActiveFilter(filter)}
                    >
                        {filter}
                    </button>
                ))}
            </div>
            
            <div className="table-container">
                <table style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Claimant</th>
                            <th>Status</th>
                            <th>Amount ($)</th>
                            <th>Fraud Risk</th>
                            <th>Risk Level</th>
                            <th>Evidence</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUpdates.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    No claims match your filters.
                                </td>
                            </tr>
                        ) : filteredUpdates.map((u, i) => (
                            <tr key={i}>
                                <td>#{u.id}</td>
                                <td>{u.claimant_name}</td>
                                <td>
                                    <span className={`status-badge ${u.status.toLowerCase()}`}>
                                        {u.status}
                                    </span>
                                </td>
                                <td>{u.claimed_amount ? u.claimed_amount.toFixed(2) : '-'}</td>
                                <td>
                                    {u.fraud_score !== undefined ? (
                                        <span className={u.fraud_score > 70 ? 'risk-high' : 'risk-low'}>
                                            {u.fraud_score}%
                                        </span>
                                    ) : (
                                        <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>Calculating...</span>
                                    )}
                                </td>
                                <td>
                                    {u.risk_level ? (
                                        <span style={{ fontWeight: 'bold', color: u.risk_level === 'CRITICAL' || u.risk_level === 'HIGH' ? 'var(--danger-color)' : 'var(--success-color)' }}>
                                            {u.risk_level}
                                        </span>
                                    ) : (
                                        '-'
                                    )}
                                </td>
                                <td>
                                    {u.evidence_url ? (
                                        <button 
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                            onClick={() => setSelectedClaim(u)}
                                        >
                                            Review
                                        </button>
                                    ) : (
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No Evidence</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Evidence Modal Overlay */}
            {selectedClaim && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                        <button 
                            onClick={() => setSelectedClaim(null)} 
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >&times;</button>
                        
                        <h2>Verification Report: Claim #{selectedClaim.id}</h2>
                        
                        {selectedClaim.evidence_url && (
                            <img src={selectedClaim.evidence_url} alt="Evidence" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--card-border)', marginBottom: '1.5rem' }} />
                        )}
                        
                        <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                            
                            <ul style={{ paddingLeft: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                <li><strong>Extracted Receipt Amount:</strong> {selectedClaim.extracted_receipt_amount ? `$${selectedClaim.extracted_receipt_amount}` : 'N/A'}</li>
                                <li><strong>Claimed Amount:</strong> ${selectedClaim.claimed_amount}</li>
                                <li><strong>Fraud Score:</strong> {selectedClaim.fraud_score}%</li>
                                <li><strong>Risk Level:</strong> {selectedClaim.risk_level}</li>
                            </ul>

                            {selectedClaim.reason_flags && selectedClaim.reason_flags.length > 0 ? (
                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontWeight: 500, fontSize: '0.9rem' }}>
                                    🚨 <strong>RISK FACTORS DETECTED:</strong>
                                    <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                                        {selectedClaim.reason_flags.map((reason, idx) => (
                                            <li key={idx}>{reason}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#d1fae5', color: '#065f46', borderRadius: '6px', fontWeight: 500, fontSize: '0.9rem' }}>
                                    ✅ No significant risk factors detected by AI.
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button className="btn" style={{ background: 'var(--success-color)' }} onClick={() => handleUpdateStatus(selectedClaim.id, 'APPROVED')}>Approve Payout</button>
                            <button className="btn" style={{ background: 'var(--danger-color)' }} onClick={() => handleUpdateStatus(selectedClaim.id, 'REJECTED')}>Reject Claim</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
