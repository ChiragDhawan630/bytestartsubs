const nodemailer = require('nodemailer');
const env = require('../config/env');

// Create transporter dynamically to pick up env changes
const getTransporter = () => {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT) || 465,
    secure: parseInt(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
};

const sendSubscriptionEmail = async (userEmail, userName, planName, subId) => {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: `"ByteStart Technologies" <${env.SMTP_USER}>`,
      to: `${userEmail}, info@bytestarttechnologies.com`,
      subject: 'Subscription Confirmed! 🚀 - ByteStart Technologies',
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Subscription Successful!</h2>
                    <p>Hi ${userName},</p>
                    <p>Thank you for subscribing to the <strong>${planName}</strong>.</p>
                    <p><strong>Subscription ID:</strong> ${subId}</p>
                    <p>We are excited to help you grow your business.</p>
                    <br>
                    <p>Best Regards,</p>
                    <p><strong>ByteStart Technologies Team</strong></p>
                </div>
            `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const sendInvoiceEmail = async (
  to,
  invoiceNumber,
  pdfBuffer,
  customSubject,
  customBody
) => {
  try {
    const transporter = getTransporter();

    const defaultBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">New Invoice</h2>
                <p>Hello,</p>
                <p>Please find attached invoice <strong>${invoiceNumber}</strong> for your recent services.</p>
                <p>The total amount is due by the date specified in the invoice.</p>
                <br>
                <p>Thank you for your business!</p>
                <p><strong>ByteStart Technologies Team</strong></p>
            </div>
        `;

    const mailOptions = {
      from: `"ByteStart Technologies (Invoicing)" <${env.SMTP_USER}>`,
      to: to,
      cc: 'info@bytestarttechnologies.com',
      subject:
        customSubject ||
        `Invoice #${invoiceNumber} from ByteStart Technologies`,
      html: customBody || defaultBody,
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Invoice sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending invoice:', error);
    return { success: false, error: error.message };
  }
};

const testConnection = async () => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('SMTP Connection Error:', error);
    throw error;
  }
};

const sendTestEmail = async (to) => {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: `"ByteStart Test" <${env.SMTP_USER}>`,
      to: to,
      subject: 'SMTP Test - ByteStart Admin',
      text: 'This is a test email to verify your SMTP configuration.',
      html: '<b style="color:green;">SMTP Configuration is working!</b><p>This is a test email sent from the admin panel.</p>'
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Test Email Error:', error);
    throw error;
  }
};

module.exports = { sendSubscriptionEmail, sendInvoiceEmail, testConnection, sendTestEmail };
