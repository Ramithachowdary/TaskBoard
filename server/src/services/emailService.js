const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpEmail = async (toEmail, otp) => {
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Your TaskBoard verification code',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 420px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #4f46e5;">Verify your TaskBoard email</h2>
        <p style="color: #374151;">Enter this code to complete your registration:</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 1.5rem; text-align: center; margin: 1.5rem 0;">
          <span style="font-size: 2.5rem; font-weight: 700; letter-spacing: 12px; color: #4f46e5;">
            ${otp}
          </span>
        </div>
        <p style="color: #6b7280; font-size: 0.875rem;">
          This code expires in <strong>10 minutes</strong>.
        </p>
        <p style="color: #6b7280; font-size: 0.875rem;">
          If you did not create a TaskBoard account, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('Resend email error:', error);
    throw new Error('Failed to send verification email');
  }
};

module.exports = { sendOtpEmail };