export const renderVerificationHtml = (otp: string) => `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <h2>Verify your email</h2>
    <p>Thank you for creating an account with Qaza.</p>
    <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">Your verification OTP is:</p>
    <p style="font-size: 36px; font-weight: bold; letter-spacing: 6px; margin: 16px 0;">${otp}</p>
    <p>This code expires in 24 hours.</p>
    <p>Regards,<br/>Qaza Support Team</p>
  </body>
</html>`;

export const renderPasswordResetHtml = (otp: string) => `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <h2>Password reset request</h2>
    <p>Use the OTP below to reset your password.</p>
    <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">Your password reset OTP is:</p>
    <p style="font-size: 36px; font-weight: bold; letter-spacing: 6px; margin: 16px 0;">${otp}</p>
    <p>This code expires in 1 hour.</p>
    <p>If you did not request this, ignore this email.</p>
    <p>Regards,<br/>Qaza Support Team</p>
  </body>
</html>`;
