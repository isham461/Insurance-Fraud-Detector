from cryptography.fernet import Fernet
import os
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# Generate a consistent AES-256 key from a secret phrase 
# In a production environment, this SECRET should be securely loaded from env variables
SECRET = os.getenv("ENCRYPTION_SECRET", "super_secret_master_key_for_aes256_insurance")

# Derive a 32-byte (256-bit) key
kdf = PBKDF2HMAC(
    algorithm=hashes.SHA256(),
    length=32,
    salt=b'insurance_static_salt',
    iterations=480000,
)
key = base64.urlsafe_b64encode(kdf.derive(SECRET.encode()))
cipher = Fernet(key)

def encrypt_data(data: str) -> str:
    """Encrypts a string using AES-256."""
    if not data:
        return data
    return cipher.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data: str) -> str:
    """Decrypts an AES-256 encrypted string."""
    if not encrypted_data:
        return encrypted_data
    return cipher.decrypt(encrypted_data.encode()).decode()

# Quick test
if __name__ == "__main__":
    original = "John Doe"
    enc = encrypt_data(original)
    dec = decrypt_data(enc)
    print(f"Original: {original}")
    print(f"Encrypted: {enc}")
    print(f"Decrypted: {dec}")
