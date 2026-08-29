import { useState } from 'react';

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
                // Note: Do NOT set Content-Type header when sending FormData. The browser sets it automatically with the correct boundary.
            });
            if (res.ok) {
                setStatusMessage('Claim submitted successfully!');
                setFormData({ claimant_name: '', incident_type: 'Vehicle Collision', claimed_amount: '', claim_text: '' });
                setEvidenceFile(null);
                setPreviewUrl(null);
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
        <div className="card">
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
        </div>
    );
};

export default ClaimForm;
