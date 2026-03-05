const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendWelcomeEmail = async (email, firstName) => {
  await transporter.sendMail({
    from: '"Owó Mi" <noreply@owomi.ng>',
    to: email,
    subject: 'Welcome to Owó Mi! 🎉',
    html: `
      <h1>Welcome ${firstName}!</h1>
      <p>Your Owó Mi account has been created successfully.</p>
      <p>Start tracking your spending and discover where your money is leaking!</p>
      <p><strong>Your Virtual Account:</strong> Check the app for your account number.</p>
    `
  });
};

const sendPasswordResetEmail = async (email, resetToken) => {
  await transporter.sendMail({
    from: '"Owó Mi" <noreply@owomi.ng>',
    to: email,
    subject: 'Reset Your Password',
    html: `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="http://localhost:3000/reset-password?token=${resetToken}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, ignore this email.</p>
    `
  });
};

module.exports = { sendWelcomeEmail, sendPasswordResetEmail };
