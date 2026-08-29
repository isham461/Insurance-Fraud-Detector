import { useState } from 'react';

interface ClaimResult {
    id: number;
    fraud_score: number;
    risk_level: string;
    reason_flags?: string[];
}

const ClaimForm: React.FC = () => {
    const [formData, setFormData] = useState({
        claimant_name: '',
        incident_type: 'Vehicle Collision',
        claimed_amount: '',
        claim_text: '',
    });
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatusMessage("Submitting...");
        
        const data = new FormData();
        data.append("claimant_name", formData.claimant_name);
        data.append("incident_type", formData.incident_type);
        data.append("claimed_amount", formData.claimed_amount);
        data.append("incident_description", formData.claim_text);
        
        if (evidenceFile) {
            data.append("evidence_file", evidenceFile);
        }

        try {
            let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
            
            const res = await fetch(`${apiUrl}/api/v1/claims`, {
                method: 'POST',
                body: data
            });
            if (res.ok) {
                const resultData = await res.json();
                setStatusMessage('');
                setFormData({ claimant_name: '', incident_type: 'Vehicle Collision', claimed_amount: '', claim_text: '' });
                setEvidenceFile(null);
                setPreviewUrl(null);
                setClaimResult({
                    id: resultData.id,
                    fraud_score: resultData.fraud_score,
                    risk_level: resultData.risk_level,
                    reason_flags: resultData.reason_flags
                });
            } else {
                setStatusMessage('Failed to submit claim.');
            }
        } catch (error) {
            console.error('Error submitting claim:', error);
            setStatusMessage('An error occurred. Is the backend running?');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEvidenceFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="card" style={{ position: 'relative' }}>
            <h2>Submit Insurance Claim</h2>
            {statusMessage && <div style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>{statusMessage}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Claimant Name</label>
                    <input 
                        required 
                        type="text" 
                        className="form-control"
                        value={formData.claimant_name} 
                        onChange={e => setFormData({...formData, claimant_name: e.target.value})} 
                    />
                </div>
                
                <div className="form-group">
                    <label>Incident Type</label>
                    <select 
                        className="form-control"
                        value={formData.incident_type} 
                        onChange={e => setFormData({...formData, incident_type: e.target.value})}
                    >
                        <option>Vehicle Collision</option>
                        <option>Property Damage</option>
                        <option>Theft</option>
                    </select>
                </div>
                
                <div className="form-group">
                    <label>Claimed Amount ($)</label>
                    <input 
                        required 
                        type="number" 
                        step="0.01"
                        className="form-control"
                        value={formData.claimed_amount} 
                        onChange={e => setFormData({...formData, claimed_amount: e.target.value})} 
                    />
                </div>

                <div className="form-group">
                    <label>Incident Description (Unstructured)</label>
                    <textarea 
                        required 
                        rows={4}
                        className="form-control"
                        placeholder="Describe the incident here..."
                        value={formData.claim_text} 
                        onChange={e => setFormData({...formData, claim_text: e.target.value})} 
                    ></textarea>
                </div>

                <div className="form-group" style={{ border: '2px dashed var(--card-border)', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                    <label style={{ cursor: 'pointer', marginBottom: '0' }}>
                        <strong>Upload Supporting Evidence</strong> <br/>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>(Receipts, Police Report, Repair Invoice - Image/PDF)</span>
                        <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                            onChange={handleFileChange}
                        />
                    </label>
                    {previewUrl && (
                        <div style={{ marginTop: '1rem' }}>
                            <img src={previewUrl} alt="Preview" style={{ maxHeight: '120px', borderRadius: '8px' }} />
                            <p style={{ fontSize: '0.8rem', color: 'var(--success-color)', margin: '0.5rem 0 0 0' }}>File attached: {evidenceFile?.name}</p>
                        </div>
                    )}
                </div>
                
                <button type="submit" className="btn">
                    Submit Claim
                </button>
            </form>

            {claimResult && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '500px', maxWidth: '90%', position: 'relative', textAlign: 'center' }}>
                        <button 
                            onClick={() => setClaimResult(null)} 
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >&times;</button>
                        
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--success-color)' }}>Claim Submitted Successfully!</h2>
                        
                        <div style={{ padding: '1.5rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid var(--card-border)', marginBottom: '1.5rem' }}>
                            <h3 style={{ marginTop: 0 }}>AI Analysis Result</h3>
                            <p><strong>Claim ID:</strong> #{claimResult.id}</p>
                            <p><strong>Fraud Score:</strong> {claimResult.fraud_score}%</p>
                            <p><strong>Risk Level:</strong> <span style={{ color: claimResult.risk_level === 'CRITICAL' || claimResult.risk_level === 'HIGH' ? 'var(--danger-color)' : 'var(--success-color)', fontWeight: 'bold' }}>{claimResult.risk_level}</span></p>
                            
                            {claimResult.reason_flags && claimResult.reason_flags.length > 0 && (
                                <div style={{ marginTop: '1rem', textAlign: 'left', background: '#fee2e2', padding: '1rem', borderRadius: '6px', color: '#991b1b', fontSize: '0.9rem' }}>
                                    <strong>Detected Risk Factors:</strong>
                                    <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem' }}>
                                        {claimResult.reason_flags.map((flag, idx) => <li key={idx}>{flag}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <button className="btn" onClick={() => setClaimResult(null)}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClaimForm;

