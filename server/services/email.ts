import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER || "admin@elitescholar.com",
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || "default_password",
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `Elite Scholar <${process.env.SMTP_USER || "admin@elitescholar.com"}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error("Email send error:", error);
      return false;
    }
  }

  async sendSchoolCreationEmail(
    adminEmail: string,
    schoolName: string,
    shortName: string,
    adminName: string,
    loginUrls: { subdomain?: string; pathBased: string }
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
          .login-info { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Elite Scholar</h1>
          </div>
          <div class="content">
            <h2>Your School Has Been Created Successfully!</h2>
            <p>Dear ${adminName},</p>
            <p>Congratulations! Your school <strong>${schoolName}</strong> has been successfully set up on the Elite Scholar platform.</p>
            
            <div class="login-info">
              <h3>Login Information:</h3>
              <p><strong>Email:</strong> ${adminEmail}</p>
              <p><strong>Temporary Password:</strong> 123456</p>
              <p><em>You will be required to change this password on your first login.</em></p>
            </div>

            <div class="login-info">
              <h3>Access Your School Dashboard:</h3>
              ${loginUrls.subdomain ? `
                <p><strong>Primary URL:</strong> <a href="${loginUrls.subdomain}" class="btn">Login via Subdomain</a></p>
                <p>${loginUrls.subdomain}</p>
              ` : ''}
              <p><strong>Alternative URL:</strong> <a href="${loginUrls.pathBased}" class="btn">Login via Path</a></p>
              <p>${loginUrls.pathBased}</p>
            </div>

            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>The Elite Scholar Team</p>
          </div>
          <div class="footer">
            <p>Powered by Elite Edu Tech</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `Welcome to Elite Scholar - ${schoolName} Setup Complete`,
      html,
    });
  }

  async sendInvoiceEmail(
    schoolEmail: string,
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

    const attachments = pdfBuffer ? [{
      filename: `${invoiceNumber}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    }] : undefined;

    return this.sendEmail({
      to: schoolEmail,
      subject: `Elite Scholar Invoice ${invoiceNumber} - ${schoolName}`,
      html,
      attachments,
    });
  }
}

export const emailService = new EmailService();
