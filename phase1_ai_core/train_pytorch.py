import torch
import torch.nn as nn
import torch.optim as optim
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split

class AnomalyAutoencoder(nn.Module):
    """
    An Autoencoder for anomaly detection. We train this ONLY on normal (non-fraudulent) claims.
    During inference, high reconstruction error = potential fraud (anomaly).
    """
    def __init__(self, input_dim):
        super(AnomalyAutoencoder, self).__init__()
        # Encoder
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 8) # Latent space
        )
        # Decoder
        self.decoder = nn.Sequential(
            nn.Linear(8, 16),
            nn.ReLU(),
            nn.Linear(16, 32),
            nn.ReLU(),
            nn.Linear(32, input_dim)
        )

    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded

def prepare_data_for_ae(filepath):
    df = pd.read_csv(filepath)
    df = df.replace('?', np.nan)
    
    # Basic cleanup
    cols_to_drop = ['_c39', 'policy_number', 'incident_location', 'policy_bind_date', 'incident_date']
    df = df.drop(columns=[col for col in cols_to_drop if col in df.columns], errors='ignore')
    
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].fillna(df[col].mode()[0])
        
    df['fraud_reported'] = df['fraud_reported'].map({'Y': 1, 'N': 0})
    
    le = LabelEncoder()
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = le.fit_transform(df[col].astype(str))
        
    # For Autoencoder, we train ONLY on the normal class (fraud == 0)
    normal_data = df[df['fraud_reported'] == 0].drop('fraud_reported', axis=1)
    
    scaler = StandardScaler()
    normal_data_scaled = scaler.fit_transform(normal_data)
    
    return normal_data_scaled, scaler, df.drop('fraud_reported', axis=1).shape[1]

def train_autoencoder(data, input_dim, epochs=50, batch_size=64):
    model = AnomalyAutoencoder(input_dim)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    tensor_data = torch.FloatTensor(data)
    dataset = torch.utils.data.TensorDataset(tensor_data, tensor_data)
    dataloader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    print("Training PyTorch Autoencoder...")
    for epoch in range(epochs):
        total_loss = 0
        for batch_features, _ in dataloader:
            optimizer.zero_grad()
            outputs = model(batch_features)
            loss = criterion(outputs, batch_features)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            
        if (epoch+1) % 10 == 0:
            print(f'Epoch [{epoch+1}/{epochs}], Loss: {total_loss/len(dataloader):.4f}')
            
    torch.save(model.state_dict(), 'pytorch_autoencoder.pth')
    print("Model saved to pytorch_autoencoder.pth")

if __name__ == "__main__":
    DATA_PATH = "../data/insurance_claims.csv"
    normal_data, scaler, input_dim = prepare_data_for_ae(DATA_PATH)
    train_autoencoder(normal_data, input_dim)
