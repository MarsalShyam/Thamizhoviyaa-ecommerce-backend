// backend/utils/notificationService.js
import nodemailer from 'nodemailer';
import axios from 'axios';

// You can trigger n8n workflow with this URL (optional)
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || null;

// 🔧 Configure Nodemailer (Gmail example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your Gmail
    pass: process.env.EMAIL_PASS, // App password (not your main password)
  },
});

// Generic function to send email
const sendEmail = async ({ to, subject, html }) => {
  if (!to) return;

  const mailOptions = {
    from: `"Thamizhoviyaa" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

// ✅ Welcome email
export const sendWelcomeEmail = async (user) => {
  try {
    if (!user.email) return; // user may have registered only with phone

    const html = `
      <h2>Welcome to Thamizhoviyaa, ${user.name} 👋</h2>
      <p>Thank you for registering with us.</p>
      <p>You can now explore our 100% natural herbal products, manage your cart and orders easily.</p>
      <p>Warm regards,<br/>Thamizhoviyaa Team</p>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Welcome to Thamizhoviyaa!',
      html,
    });

    // (Optional) trigger n8n workflow for WhatsApp / logging
    if (N8N_WEBHOOK_URL) {
      await axios.post(N8N_WEBHOOK_URL, {
        type: 'welcome',
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    }
  } catch (err) {
    console.error('Error sending welcome email:', err.message);
  }
};

// ✅ Password reset email
export const sendPasswordResetEmail = async (user, resetUrl) => {
  try {
    if (!user.email) return;

    const html = `
      <h2>Reset your password</h2>
      <p>Hello ${user.name},</p>
      <p>We received a request to reset your password.</p>
      <p>Click the link below to set a new password (valid for 1 hour):</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p>Regards,<br/>Thamizhoviyaa Team</p>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html,
    });

    if (N8N_WEBHOOK_URL) {
      await axios.post(N8N_WEBHOOK_URL, {
        type: 'password_reset',
        email: user.email,
        phone: user.phone,
      });
    }
  } catch (err) {
    console.error('Error sending reset email:', err.message);
  }
};
