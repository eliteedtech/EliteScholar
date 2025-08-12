import { v2 as cloudinary } from 'cloudinary';
import { storage } from '../storage';
import * as nodemailer from 'nodemailer';
import type { ConnectionTestResult } from '@shared/schema';

export class ConnectionTestService {
  async testSendGrid(apiKey: string): Promise<ConnectionTestResult> {
    const now = new Date();
    
    if (!apiKey) {
      return {
        service: 'sendgrid',
        status: 'error',
        message: 'SendGrid API key is required',
        lastChecked: now
      };
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/user/account', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await storage.updateServiceStatus('sendgrid', 'connected');
        return {
          service: 'sendgrid',
          status: 'connected',
          message: 'SendGrid connection successful',
          lastChecked: now
        };
      } else {
        const errorText = await response.text();
        await storage.updateServiceStatus('sendgrid', 'error', `HTTP ${response.status}: ${errorText}`);
        return {
          service: 'sendgrid',
          status: 'error',
          message: `SendGrid API error: ${response.status}`,
          lastChecked: now
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await storage.updateServiceStatus('sendgrid', 'error', message);
      return {
        service: 'sendgrid',
        status: 'error',
        message: `Connection failed: ${message}`,
        lastChecked: now
      };
    }
  }

  async testTwilio(accountSid: string, authToken: string, phoneNumber?: string): Promise<ConnectionTestResult> {
    const now = new Date();
    
    if (!accountSid || !authToken) {
      return {
        service: 'twilio',
        status: 'error',
        message: 'Twilio Account SID and Auth Token are required',
        lastChecked: now
      };
    }

    try {
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.ok) {
        const accountData = await response.json();
        await storage.updateServiceStatus('twilio_sms', 'connected');
        
        if (phoneNumber?.includes('whatsapp:')) {
          await storage.updateServiceStatus('twilio_whatsapp', 'connected');
        }
        
        return {
          service: 'twilio',
          status: 'connected',
          message: `Connected to account: ${(accountData as any).friendly_name}`,
          lastChecked: now
        };
      } else {
        const errorText = await response.text();
        await storage.updateServiceStatus('twilio_sms', 'error', `HTTP ${response.status}: ${errorText}`);
        return {
          service: 'twilio',
          status: 'error',
          message: `Twilio API error: ${response.status}`,
          lastChecked: now
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await storage.updateServiceStatus('twilio_sms', 'error', message);
      return {
        service: 'twilio',
        status: 'error',
        message: `Connection failed: ${message}`,
        lastChecked: now
      };
    }
  }

  async testCloudinary(cloudName: string, apiKey: string, apiSecret: string): Promise<ConnectionTestResult> {
    const now = new Date();
    
    if (!cloudName || !apiKey || !apiSecret) {
      return {
        service: 'cloudinary',
        status: 'error',
        message: 'Cloudinary cloud name, API key, and API secret are required',
        lastChecked: now
      };
    }

    try {
      // Configure Cloudinary
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });

      // Test connection by getting account details
      const result = await cloudinary.api.ping();
      
      if (result.status === 'ok') {
        await storage.updateServiceStatus('cloudinary', 'connected');
        return {
          service: 'cloudinary',
          status: 'connected',
          message: 'Cloudinary connection successful',
          lastChecked: now
        };
      } else {
        await storage.updateServiceStatus('cloudinary', 'error', 'Ping failed');
        return {
          service: 'cloudinary',
          status: 'error',
          message: 'Cloudinary ping failed',
          lastChecked: now
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await storage.updateServiceStatus('cloudinary', 'error', message);
      return {
        service: 'cloudinary',
        status: 'error',
        message: `Connection failed: ${message}`,
        lastChecked: now
      };
    }
  }

  async testSMTP(host: string, port: string, user: string, password: string, secure: boolean = false): Promise<ConnectionTestResult> {
    const now = new Date();
    
    if (!host || !user || !password) {
      return {
        service: 'smtp',
        status: 'error',
        message: 'SMTP host, user, and password are required',
        lastChecked: now
      };
    }

    try {
      const transporter = nodemailer.createTransporter({
        host,
        port: parseInt(port) || 587,
        secure,
        auth: {
          user,
          pass: password
        }
      });

      // Verify connection
      await transporter.verify();
      
      await storage.updateServiceStatus('smtp', 'connected');
      return {
        service: 'smtp',
        status: 'connected',
        message: 'SMTP connection successful',
        lastChecked: now
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await storage.updateServiceStatus('smtp', 'error', message);
      return {
        service: 'smtp',
        status: 'error',
        message: `SMTP connection failed: ${message}`,
        lastChecked: now
      };
    }
  }

  async testAllServices(config: any): Promise<ConnectionTestResult[]> {
    const results: ConnectionTestResult[] = [];

    // Test SendGrid
    if (config.sendgridApiKey) {
      results.push(await this.testSendGrid(config.sendgridApiKey));
    }

    // Test Twilio
    if (config.twilioAccountSid && config.twilioAuthToken) {
      results.push(await this.testTwilio(
        config.twilioAccountSid, 
        config.twilioAuthToken, 
        config.twilioPhoneNumber
      ));
    }

    // Test Cloudinary
    if (config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret) {
      results.push(await this.testCloudinary(
        config.cloudinaryCloudName,
        config.cloudinaryApiKey,
        config.cloudinaryApiSecret
      ));
    }

    // Test SMTP
    if (config.smtpHost && config.smtpUser && config.smtpPassword) {
      results.push(await this.testSMTP(
        config.smtpHost,
        config.smtpPort || '587',
        config.smtpUser,
        config.smtpPassword,
        config.smtpSecure || false
      ));
    }

    return results;
  }
}

export const connectionTestService = new ConnectionTestService();