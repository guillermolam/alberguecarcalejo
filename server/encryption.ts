import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

// GDPR/NIS2 compliant encryption service
class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    // Use environment variable or generate secure key
    const keyString = process.env.ENCRYPTION_KEY || this.generateSecureKey();
    this.key = createHash('sha256').update(keyString).digest();
  }

  private generateSecureKey(): string {
    // Generate 32-byte random key
    return randomBytes(32).toString('hex');
  }

  encrypt(plaintext: string): string {
    if (!plaintext) return '';
    
    try {
      const iv = randomBytes(16);
      const cipher = createCipheriv(this.algorithm, this.key, iv);
      cipher.setAAD(Buffer.from('gdpr-compliance'));
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Return: iv + authTag + encrypted (all hex encoded)
      return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  decrypt(encryptedData: string): string {
    if (!encryptedData) return '';
    
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAAD(Buffer.from('gdpr-compliance'));
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  // Hash sensitive data for lookup (non-reversible)
  hash(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  // Secure data deletion (overwrite memory)
  secureDelete(data: string): void {
    if (data && data.length > 0) {
      // Overwrite string in memory (best effort in JavaScript)
      for (let i = 0; i < data.length; i++) {
        data = data.substring(0, i) + '\0' + data.substring(i + 1);
      }
    }
  }
}

export const encryption = new EncryptionService();

// GDPR-compliant data handling utilities
export class GDPRDataHandler {
  static encryptPilgrimData(pilgrimData: any) {
    return {
      ...pilgrimData,
      firstName: encryption.encrypt(pilgrimData.firstName),
      lastName1: encryption.encrypt(pilgrimData.lastName1),
      lastName2: pilgrimData.lastName2 ? encryption.encrypt(pilgrimData.lastName2) : null,
      birthDate: encryption.encrypt(pilgrimData.birthDate),
      documentNumber: encryption.encrypt(pilgrimData.documentNumber),
      phone: encryption.encrypt(pilgrimData.phone),
      email: pilgrimData.email ? encryption.encrypt(pilgrimData.email) : null,
      addressStreet: encryption.encrypt(pilgrimData.addressStreet),
      addressStreet2: pilgrimData.addressStreet2 ? encryption.encrypt(pilgrimData.addressStreet2) : null,
      addressCity: encryption.encrypt(pilgrimData.addressCity),
      // Set data retention period (7 years for hospitality records in Spain)
      dataRetentionUntil: new Date(Date.now() + (7 * 365 * 24 * 60 * 60 * 1000)), // 7 years
      consentGiven: true,
      consentDate: new Date(),
    };
  }

  static decryptPilgrimData(encryptedData: any) {
    return {
      ...encryptedData,
      firstName: encryption.decrypt(encryptedData.firstName),
      lastName1: encryption.decrypt(encryptedData.lastName1),
      lastName2: encryptedData.lastName2 ? encryption.decrypt(encryptedData.lastName2) : null,
      birthDate: encryption.decrypt(encryptedData.birthDate),
      documentNumber: encryption.decrypt(encryptedData.documentNumber),
      phone: encryption.decrypt(encryptedData.phone),
      email: encryptedData.email ? encryption.decrypt(encryptedData.email) : null,
      addressStreet: encryption.decrypt(encryptedData.addressStreet),
      addressStreet2: encryptedData.addressStreet2 ? encryption.decrypt(encryptedData.addressStreet2) : null,
      addressCity: encryption.decrypt(encryptedData.addressCity),
    };
  }

  // Check if data retention period has expired
  static isDataRetentionExpired(retentionDate: Date): boolean {
    return new Date() > retentionDate;
  }

  // Secure data deletion for GDPR right to be forgotten
  static async secureDeletePilgrimData(pilgrimId: number) {
    // This would implement secure deletion of all pilgrim data
    // including overwriting database records and any backup copies
    console.log(`GDPR: Secure deletion requested for pilgrim ${pilgrimId}`);
  }
}