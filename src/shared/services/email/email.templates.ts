export const renderVerificationHtml = (link: string) => `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <h2>Verify your email</h2>
    <p>Thank you for creating an account with Qaza. Please verify your email address by using the link below.</p>
    <p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#2f74eb;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a></p>
    <p>If the button does not work, paste the following link into your browser:</p>
    <p>${link}</p>
    <p>Regards,<br/>Qaza Support Team</p>
  </body>
</html>`;

export const renderPasswordResetHtml = (link: string) => `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <h2>Password reset request</h2>
    <p>We received a request to reset your password. To continue, click the link below:</p>
    <p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#2f74eb;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p>
    <p>If you did not request this, you can ignore this email.</p>
    <p>If the button does not work, paste the following link into your browser:</p>
    <p>${link}</p>
    <p>Regards,<br/>Qaza Support Team</p>
  </body>
</html>`;
