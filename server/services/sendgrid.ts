import { MailService } from '@sendgrid/mail';

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export class SendGridService {
  private mailService: MailService;
  private isConfigured: boolean = false;

  constructor() {
    this.mailService = new MailService();
    this.initializeSendGrid();
  }

  private initializeSendGrid() {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (apiKey) {
      this.mailService.setApiKey(apiKey);
      this.isConfigured = true;
    } else {
      console.log('SendGrid API key not configured');
      this.isConfigured = false;
    }
  }

  public isAvailable(): boolean {
    return this.isConfigured;
  }

  public async sendEmail(params: EmailParams): Promise<boolean> {
    if (!this.isAvailable()) {
      console.error('SendGrid service not available');
      return false;
    }

    try {
      await this.mailService.send({
        to: params.to,
        from: params.from,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
      console.log(`Email sent successfully to ${params.to}`);
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  public async sendInvoiceEmail(
    to: string,
    schoolName: string,
    invoiceNumber: string,
    amount: string,
    dueDate: string,
    pdfBuffer?: Buffer
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8fafc; }
          .invoice-info { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .amount { font-size: 24px; font-weight: bold; color: #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Elite Scholar Invoice</h1>
          </div>
          <div class="content">
            <h2>New Invoice - ${invoiceNumber}</h2>
            <p>Dear ${schoolName} Administrator,</p>
            <p>We have generated a new invoice for your school's subscription services.</p>
            
            <div class="invoice-info">
              <h3>Invoice Details:</h3>
              <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
              <p><strong>Amount:</strong> <span class="amount">₦${amount}</span></p>
              <p><strong>Due Date:</strong> ${dueDate}</p>
            </div>

            <p>Please ensure payment is made before the due date to avoid any interruption in services.</p>
            <p>If you have any questions regarding this invoice, please contact our billing department.</p>
            <p>Thank you for choosing Elite Scholar.</p>
            <p>Best regards,<br>The Elite Scholar Billing Team</p>
          </div>
          <div class="footer">
            <p>Powered by Elite Edu Tech</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const fromEmail = process.env.SMTP_USER || "admin@elitescholar.com";
    const emailData: any = {
      to: to,
      from: fromEmail,
      subject: `Elite Scholar Invoice ${invoiceNumber} - ${schoolName}`,
      html,
    };

    if (pdfBuffer) {
      emailData.attachments = [{
        filename: `${invoiceNumber}.pdf`,
        content: pdfBuffer.toString('base64'),
        type: "application/pdf",
        disposition: "attachment",
      }];
    }

    return this.sendEmail(emailData);
  }
}

export const sendGridService = new SendGridService();