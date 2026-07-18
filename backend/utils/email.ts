import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

let transporter: nodemailer.Transporter | null = null;

export function initEmailTransport() {
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  };

  if (!config.auth.user || !config.auth.pass) {
    console.warn('Email credentials not configured. Email sending will be disabled.');
    return null;
  }

  transporter = nodemailer.createTransport(config);
  return transporter;
}

export async function sendPasswordResetEmail(email: string, otp: string) {
  if (!transporter) {
    transporter = initEmailTransport();
  }

  if (!transporter) {
    console.warn('Email transporter not available. Skipping email send.');
    return false;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '"ModernShop" <noreply@modernshop.com>',
    to: email,
    subject: 'Password Reset OTP - ModernShop',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">ModernShop</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
          <h2 style="color: #333; margin-top: 0;">Password Reset OTP</h2>
          <p style="color: #666; line-height: 1.6;">
            You recently requested to reset your password for your ModernShop account. 
            Use the following One-Time Password (OTP) to reset your password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #000; color: white; padding: 20px 40px; 
                        border-radius: 5px; font-weight: bold; font-size: 32px; 
                        letter-spacing: 8px; display: inline-block;">
              ${otp}
            </div>
          </div>
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            This OTP will expire in 10 minutes. If you did not request a password reset, 
            please ignore this email.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendNewsletterEmail(email: string, subject: string, content: string) {
  if (!transporter) {
    transporter = initEmailTransport();
  }

  if (!transporter) {
    console.warn('Email transporter not available. Skipping email send.');
    return false;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '"ModernShop" <noreply@modernshop.com>',
    to: email,
    subject: `${subject} - ModernShop`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">ModernShop Newsletter</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
          <h2 style="color: #333; margin-top: 0;">${subject}</h2>
          <div style="color: #666; line-height: 1.6; white-space: pre-wrap;">
            ${content}
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              You're receiving this email because you subscribed to ModernShop's newsletter.
            </p>
            <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
              © 2026 ModernShop. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Newsletter email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending newsletter email:', error);
    return false;
  }
}

export async function sendOrderConfirmationEmail(email: string, orderNumber: string, totalAmount: number, items: any[]): Promise<boolean> {
  if (!transporter) {
    transporter = initEmailTransport();
  }

  if (!transporter) {
    console.warn('Email transporter not available. Skipping email send.');
    return false;
  }

  const itemsList = items.map(item => `<li>${item.productName} (Qty: ${item.quantity}) - ₹${item.price.toFixed(2)}</li>`).join('');

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '"ModernShop" <noreply@modernshop.com>',
    to: email,
    subject: `Order Confirmation - ${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">ModernShop</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
          <h2 style="color: #333; margin-top: 0;">Order Confirmed!</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for your purchase. Your order <strong>${orderNumber}</strong> has been confirmed successfully.
          </p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Order Details:</h3>
            <ul style="color: #666; line-height: 1.6;">${itemsList}</ul>
            <p style="color: #333; font-weight: bold; font-size: 18px; margin: 20px 0 0 0;">
              Total Amount: ₹${totalAmount.toFixed(2)}
            </p>
          </div>
          <p style="color: #666; line-height: 1.6;">
            You can track your order status on your dashboard.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
}

export async function sendOrderStatusUpdateEmail(email: string, orderNumber: string, status: string): Promise<boolean> {
  if (!transporter) {
    transporter = initEmailTransport();
  }

  if (!transporter) {
    console.warn('Email transporter not available. Skipping email send.');
    return false;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '"ModernShop" <noreply@modernshop.com>',
    to: email,
    subject: `Order Status Update - ${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">ModernShop</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
          <h2 style="color: #333; margin-top: 0;">Order Status Updated</h2>
          <p style="color: #666; line-height: 1.6;">
            Your order <strong>${orderNumber}</strong> status has been updated to: <strong>${status}</strong>
          </p>
          <p style="color: #666; line-height: 1.6;">
            Thank you for shopping with ModernShop!
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Order status update email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending order status update email:', error);
    return false;
  }
}

export async function sendGeneralNotificationEmail(email: string, title: string, message: string): Promise<boolean> {
  if (!transporter) {
    transporter = initEmailTransport();
  }

  if (!transporter) {
    console.warn('Email transporter not available. Skipping email send.');
    return false;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '"ModernShop" <noreply@modernshop.com>',
    to: email,
    subject: `${title} - ModernShop`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">ModernShop</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
          <h2 style="color: #333; margin-top: 0;">${title}</h2>
          <p style="color: #666; line-height: 1.6;">
            ${message}
          </p>
          <p style="color: #666; line-height: 1.6;">
            Thank you for being a valued customer at ModernShop!
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`General notification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending general notification email:', error);
    return false;
  }
}
