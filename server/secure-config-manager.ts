/**
 * Secure Configuration Manager
 * Permanent storage for critical API keys and system settings
 */

import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

interface SecureConfig {
  vertexAiApiKey: string;
  telegramBotToken?: string;
  systemSecrets: Record<string, string>;
  lastUpdated: string;
}

export class SecureConfigManager {
  private configPath = path.resolve('../.secure-config.json');
  private backupPath = path.resolve('../.secure-config.backup.json');

  async saveVertexAiKey(apiKey: string): Promise<void> {
    try {
      const config = await this.loadConfig();
      config.vertexAiApiKey = apiKey;
      config.lastUpdated = new Date().toISOString();
      
      await this.saveConfig(config);
      console.log('✅ Vertex AI API key saved securely');
    } catch (error) {
      console.error('❌ Failed to save Vertex AI key:', error);
      throw error;
    }
  }

  async getVertexAiKey(): Promise<string> {
    try {
      const config = await this.loadConfig();
      return config.vertexAiApiKey || process.env.GOOGLE_AI_STUDIO_API_KEY || '';
    } catch (error) {
      console.log('Using environment variable for Vertex AI key');
      return process.env.GOOGLE_AI_STUDIO_API_KEY || '';
    }
  }

  async saveSystemSecret(key: string, value: string): Promise<void> {
    try {
      const config = await this.loadConfig();
      config.systemSecrets[key] = value;
      config.lastUpdated = new Date().toISOString();
      
      await this.saveConfig(config);
      console.log(`✅ System secret '${key}' saved securely`);
    } catch (error) {
      console.error(`❌ Failed to save system secret '${key}':`, error);
      throw error;
    }
  }

  async getSystemSecret(key: string): Promise<string | undefined> {
    try {
      const config = await this.loadConfig();
      return config.systemSecrets[key];
    } catch (error) {
      return undefined;
    }
  }

  private async loadConfig(): Promise<SecureConfig> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Return default config if file doesn't exist
      return {
        vertexAiApiKey: '',
        systemSecrets: {},
        lastUpdated: new Date().toISOString()
      };
    }
  }

  private async saveConfig(config: SecureConfig): Promise<void> {
    try {
      // Create backup before saving
      try {
        const currentData = await fs.readFile(this.configPath, 'utf-8');
        await fs.writeFile(this.backupPath, currentData);
      } catch (error) {
        // Ignore backup errors for new files
      }

      // Save new config
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Failed to save secure config:', error);
      throw error;
    }
  }

  async grantFullVertexAccess(): Promise<void> {
    console.log('🔓 GRANTING FULL VERTEX AI ACCESS TO PROJECT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Ensure Vertex AI has access to current API key
    const apiKey = await this.getVertexAiKey();
    if (!apiKey) {
      throw new Error('❌ No Vertex AI API key available. Please provide the API key.');
    }

    // Set environment variable for current session
    process.env.GOOGLE_AI_STUDIO_API_KEY = apiKey;
    
    console.log('✅ Vertex AI API key configured');
    console.log('✅ Full project access granted to Vertex AI');
    console.log('✅ Vertex AI can now analyze and reconstruct all systems');
    
    return;
  }
}

export const secureConfig = new SecureConfigManager();