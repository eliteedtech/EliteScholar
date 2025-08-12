import twilio from 'twilio';

interface WhatsAppMessage {
  to: string;
  message: string;
  mediaUrl?: string;
}

export class TwilioService {
  private twilioClient: any | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTwilio();
  }

  private initializeTwilio() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (accountSid && authToken) {
      this.twilioClient = twilio(accountSid, authToken);
      this.isConfigured = true;
    } else {
      console.log('Twilio credentials not configured');
      this.isConfigured = false;
    }
  }

  public isAvailable(): boolean {
    return this.isConfigured && this.twilioClient !== null;
  }

  public async sendWhatsAppMessage(options: WhatsAppMessage): Promise<boolean> {
    if (!this.isAvailable()) {
      console.error('Twilio service not available');
      return false;
    }

    try {
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      if (!fromNumber) {
        console.error('Twilio phone number not configured');
        return false;
      }

      const messageOptions: any = {
        body: options.message,
        from: `whatsapp:${fromNumber}`,
        to: `whatsapp:${options.to}`,
      };

      if (options.mediaUrl) {
        messageOptions.mediaUrl = [options.mediaUrl];
      }

      const message = await this.twilioClient!.messages.create(messageOptions);
      console.log(`WhatsApp message sent successfully: ${message.sid}`);
      return true;
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return false;
    }
  }

  public async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.isAvailable()) {
      console.error('Twilio service not available');
      return false;
    }

    try {
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      if (!fromNumber) {
        console.error('Twilio phone number not configured');
        return false;
      }

      const smsMessage = await this.twilioClient!.messages.create({
        body: message,
        from: fromNumber,
        to: to,
      });

      console.log(`SMS sent successfully: ${smsMessage.sid}`);
      return true;
    } catch (error) {
      console.error('SMS send error:', error);
      return false;
    }
  }
}

export const twilioService = new TwilioService();