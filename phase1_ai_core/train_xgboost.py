import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import xgboost as xgb
import joblib
import os
import re

def parse_price(price_str):
    if pd.isna(price_str):
        return 0.0
    s = str(price_str).lower().replace(',', '')
    nums = re.findall(r'\d+', s)
    if not nums:
        return 0.0
    if len(nums) == 1:
        return float(nums[0])
    return (float(nums[0]) + float(nums[1])) / 2.0

def load_combined_data():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data'))
    
    # 1. insurance_claims.csv
    df1 = pd.read_csv(os.path.join(base_dir, "insurance_claims.csv"))
    df1_clean = pd.DataFrame({
        'amount': df1['total_claim_amount'].astype(float),
        'police_report': df1['police_report_available'].apply(lambda x: 1 if str(x).strip().upper() == 'YES' else 0),
        'target': df1['fraud_reported'].apply(lambda x: 1 if str(x).strip().upper() == 'Y' else 0)
    })
    
    # 2. carclaims.csv
    df2 = pd.read_csv(os.path.join(base_dir, "carclaims.csv"))
    df2_clean = pd.DataFrame({
        'amount': df2['VehiclePrice'].apply(parse_price),
        'police_report': df2['PoliceReportFiled'].apply(lambda x: 1 if str(x).strip().upper() == 'YES' else 0),
        'target': df2['FraudFound'].apply(lambda x: 1 if str(x).strip().upper() == 'YES' else 0)
    })
    
    # 3. fraud_oracle.csv
    df3 = pd.read_csv(os.path.join(base_dir, "fraud_oracle.csv"))
    df3_clean = pd.DataFrame({
        'amount': df3['VehiclePrice'].apply(parse_price),
        'police_report': df3['PoliceReportFiled'].apply(lambda x: 1 if str(x).strip().upper() == 'YES' else 0),
        'target': df3['FraudFound_P'].astype(int)
    })
    
    # Combine all
    combined = pd.concat([df1_clean, df2_clean, df3_clean], ignore_index=True)
    print(f"Combined dataset shape: {combined.shape}")
    return combined

def train_xgboost(df):
    X = df[['amount', 'police_report']]
    y = df['target']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    scale_pos_weight = (y_train == 0).sum() / max((y_train == 1).sum(), 1)
    
    model = xgb.XGBClassifier(
        objective='binary:logistic',
        scale_pos_weight=scale_pos_weight,
        random_state=42,
        eval_metric='auc',
        learning_rate=0.05,
        max_depth=4,
        n_estimators=100
    )
    
    print("Training XGBoost...")
    model.fit(X_train, y_train)
    
    print("\n--- Evaluation on Test Set ---")
    y_pred = model.predict(X_test)
    print(confusion_matrix(y_test, y_pred))
    print(classification_report(y_test, y_pred))
    
    model_path = os.path.join(os.path.dirname(__file__), 'xgboost_fraud_model.pkl')
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    df = load_combined_data()
    train_xgboost(df)
