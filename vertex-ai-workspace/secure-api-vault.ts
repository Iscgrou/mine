/**
 * Secure API Vault - Protected Storage for Critical API Keys
 * Isolated from regular settings to prevent loss during system reconstruction
 */

import fs from 'fs/promises';
import path from 'path';

interface SecureAPIVault {
  vertexAIApiKey: string;
  googleCloudProjectId?: string;
  serviceAccountKey?: string;
  grokApiKey: string;
  sentimentApiKey: string;
  sttApiKey: string;
  customKeys: Record<string, string>;
  vaultCreated: string;
  lastAccessed: string;
}

export class SecureAPIManager {
  private vaultPath = path.resolve('../.secure-api-vault.json');
  private backupPath = path.resolve('../.secure-api-vault.backup.json');
  private lockPath = path.resolve('../.vault.lock');

  async saveVertexAICredentials(apiKey: string, projectId?: string, serviceAccountJson?: string): Promise<void> {
    await this.acquireLock();
    try {
      const vault = await this.loadVault();
      vault.vertexAIApiKey = apiKey;
      if (projectId) vault.googleCloudProjectId = projectId;
      if (serviceAccountJson) vault.serviceAccountKey = serviceAccountJson;
      vault.lastAccessed = new Date().toISOString();
      
      await this.saveVault(vault);
      
      // Set environment variable for immediate use
      process.env.GOOGLE_AI_STUDIO_API_KEY = apiKey;
      if (serviceAccountJson) {
        process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = serviceAccountJson;
      }
      
      console.log('✅ Vertex AI credentials secured in vault');
    } finally {
      await this.releaseLock();
    }
  }

  async getVertexAIKey(): Promise<string> {
    try {
      const vault = await this.loadVault();
      return vault.vertexAIApiKey || process.env.GOOGLE_AI_STUDIO_API_KEY || '';
    } catch (error) {
      return process.env.GOOGLE_AI_STUDIO_API_KEY || '';
    }
  }

  private async loadVault(): Promise<SecureAPIVault> {
    try {
      const data = await fs.readFile(this.vaultPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return {
        vertexAIApiKey: '',
        grokApiKey: process.env.GROK_API_KEY || '',
        sentimentApiKey: process.env.SENTIMENT_API_KEY || '',
        sttApiKey: process.env.STT_API_KEY || '',
        customKeys: {},
        vaultCreated: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      };
    }
  }

  private async saveVault(vault: SecureAPIVault): Promise<void> {
    try {
      const currentData = await fs.readFile(this.vaultPath, 'utf-8');
      await fs.writeFile(this.backupPath, currentData);
    } catch (error) {
      // Ignore backup errors for new files
    }

    await fs.writeFile(this.vaultPath, JSON.stringify(vault, null, 2), { mode: 0o600 });
  }

  private async acquireLock(): Promise<void> {
    const maxRetries = 10;
    for (let i = 0; i < maxRetries; i++) {
      try {
        await fs.writeFile(this.lockPath, process.pid.toString(), { flag: 'wx' });
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw new Error('Could not acquire vault lock');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  private async releaseLock(): Promise<void> {
    try {
      await fs.unlink(this.lockPath);
    } catch (error) {
      // Ignore unlock errors
    }
  }
}

export const secureAPI = new SecureAPIManager();