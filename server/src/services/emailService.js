const nodemailer = require('nodemailer');

/**
 * Gmail SMTP transporter.
 *
 * Uses a Gmail App Password (not your real Gmail password).
 * Setup: Gmail → Security → 2-Step Verification → App passwords
 *
 * Why 'gmail' service shorthand?
 * Nodemailer knows Gmail's SMTP settings (smtp.gmail.com:587 with STARTTLS).
 * Using service: 'gmail' is cleaner than manually setting host/port/secure.
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Verifies the SMTP connection on startup.
 * Logs a warning if credentials are wrong — avoids silent failures.
 */
transporter.verify((error) => {
  if (error) {
    console.warn('Gmail SMTP connection failed:', error.message);
    console.warn('Check GMAIL_USER and GMAIL_APP_PASSWORD in your .env');
  } else {
    console.log('Gmail SMTP ready');
  }
});

/**
 * Sends an OTP verification email.
 * @param {string} toEmail - recipient's email address
 * @param {string} otp - plaintext 6-digit OTP (never stored, only sent)
 */
const sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `TaskBoard <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Your TaskBoard verification code',
    // Plain text fallback for email clients that don't render HTML
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
    // Re-throw so the controller can handle the failure
    // (e.g., rollback user creation)
    throw new Error('Failed to send verification email. Please try again.');
  }
};

module.exports = { sendOtpEmail };