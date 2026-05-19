const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

transporter.verify((error) => {
  if (error) {
    console.warn('Gmail SMTP connection failed:', error.message);
    console.warn('Check GMAIL_USER and GMAIL_APP_PASSWORD in your .env');
  } else {
    console.log('Gmail SMTP ready');
  }
});

const sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `TaskBoard <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Your TaskBoard verification code',
    text: `Your TaskBoard verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not create a TaskBoard account, ignore this email.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 420px; margin: 0 auto; padding: 2rem; background: #ffffff;">
        <h2 style="color: #4f46e5; margin-bottom: 0.5rem;">Verify your TaskBoard email</h2>
        <p style="color: #374151; margin-bottom: 1.5rem;">Enter this code to complete your registration:</p>

        <div style="background: #f3f4f6; border-radius: 12px; padding: 2rem; text-align: center; margin: 1.5rem 0;">
          <span style="font-size: 2.5rem; font-weight: 700; letter-spacing: 14px; color: #4f46e5; font-family: monospace;">
            ${otp}
          </span>
        </div>

        <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.5rem;">
          ⏰ This code expires in <strong>10 minutes</strong>.
        </p>
        <p style="color: #6b7280; font-size: 0.875rem;">
          If you did not create a TaskBoard account, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Gmail send error:', error.message);
    throw new Error('Failed to send verification email. Please try again.');
  }
};

module.exports = { sendOtpEmail };