import nodemailer from "nodemailer";

// Transporter Gmail SMTP — se usa como fallback si Resend falla
export const gmailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});
