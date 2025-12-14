// backend/utils/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Only load .env in local/dev. On Render, env vars come from the platform.
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// 👇 This is the important part
const CLIENT_URL = process.env.CLIENT_URL;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  if (!to) return;

  try {
    await transporter.sendMail({
      from: `"Thamizhoviyaa" <${EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Error sending email:', err);
  }
};

// 🔗 verification email
export const sendVerificationEmail = async (user, token) => {
  console.log('CLIENT_URL used in verification email:', CLIENT_URL);

  const verifyUrl = `${CLIENT_URL}/verify-email?token=${token}`;

  const html = `
    <h2>Verify your email</h2>
    <p>Hello ${user.name},</p>
    <p>Thanks for registering at Thamizhoviyaa.</p>
    <p>Click the link below to verify your email:</p>
    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    <p>If you did not create this account, you can ignore this email.</p>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Verify your email - Thamizhoviyaa',
    html,
  });
};

// 🔗 password reset email
export const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${CLIENT_URL}/reset-password/${token}`;

  const html = `
    <h2>Reset your password</h2>
    <p>Hello ${user.name},</p>
    <p>We received a request to reset your password.</p>
    <p>Click the link below to set a new password (valid for 1 hour):</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Password reset - Thamizhoviyaa',
    html,
  });
};
