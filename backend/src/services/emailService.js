/**
 * Email Dispatch Service
 * 
 * RESPONSIBILITY:
 * Sends transactional emails (such as welcome emails with login credentials)
 * using Nodemailer. Supports configured SMTP server with automatic graceful logging.
 */

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
  } else {
    // Return null when unconfigured so we don't block on network handshakes to dummy servers
    transporter = null;
  }

  return transporter;
}

/**
 * Sends a welcome credentials email to a newly created employee.
 * 
 * @param {object} params
 * @param {string} params.to - Recipient employee email
 * @param {string} params.name - Employee full name
 * @param {string} params.email - Login email address
 * @param {string} params.password - Initial / temporary password
 * @param {Array<string>} [params.roleNames] - Assigned RBAC role names
 * @returns {Promise<object>}
 */
async function sendWelcomeCredentialsEmail({ to, name, email, password, roleNames = ['Employee'] }) {
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173/login';
  const fromAddress = process.env.SMTP_FROM || '"PeoplePay360 HR" <noreply@peoplepay360.com>';

  const subject = `Welcome to PeoplePay360 - Your Account Credentials`;
  const roleText = roleNames.join(', ');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
        .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
        .header p { margin: 4px 0 0 0; font-size: 13px; opacity: 0.85; }
        .content { padding: 24px; color: #334155; font-size: 14px; line-height: 1.6; }
        .credentials-box { background: #f1f5f9; border-left: 4px solid #4f46e5; border-radius: 6px; padding: 16px; margin: 20px 0; }
        .cred-item { margin-bottom: 8px; }
        .cred-item:last-child { margin-bottom: 0; }
        .label { font-weight: 600; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
        .val { font-family: monospace; font-size: 14px; font-weight: 700; color: #1e293b; background: #ffffff; padding: 4px 8px; border-radius: 4px; display: inline-block; border: 1px solid #cbd5e1; }
        .btn-container { text-align: center; margin: 28px 0 16px 0; }
        .btn { background: #4f46e5; color: #ffffff !important; padding: 12px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.25); }
        .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>PeoplePay360</h1>
          <p>Welcome to the Team</p>
        </div>
        <div class="content">
          <p>Hello <strong>${name}</strong>,</p>
          <p>An employee user account has been created for you on the <strong>PeoplePay360</strong> HR & Payroll Suite. You can now log in to view your profile, manage attendance, submit time-off requests, and access your payslips.</p>
          
          <div class="credentials-box">
            <div class="cred-item">
              <span class="label">Login Email</span>
              <span class="val">${email}</span>
            </div>
            <div class="cred-item" style="margin-top: 10px;">
              <span class="label">Password</span>
              <span class="val">${password}</span>
            </div>
            <div class="cred-item" style="margin-top: 10px;">
              <span class="label">Assigned Roles</span>
              <span style="font-size: 13px; font-weight: 600; color: #4338ca;">${roleText}</span>
            </div>
          </div>

          <div class="btn-container">
            <a href="${loginUrl}" class="btn" target="_blank">Log In to PeoplePay360</a>
          </div>

          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
            <em>Security Tip: For your protection, please log in and update your password after your initial sign-in.</em>
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} PeoplePay360 HR & Payroll Suite. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to PeoplePay360, ${name}!

Your employee user account has been created with the following login credentials:

- Login Email: ${email}
- Password: ${password}
- Assigned Role(s): ${roleText}
- Login URL: ${loginUrl}

Please log in and update your password after your initial sign-in.
  `;

  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL NOTIFICATION DISPATCHED]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Credentials -> Email: ${email} | Password: ${password} | Roles: ${roleText}`);
  console.log(`======================================================\n`);

  try {
    const mailClient = getTransporter();
    if (!mailClient) {
      console.log(`ℹ️ [SMTP INFO] Live SMTP not configured in backend/.env (SMTP_USER & SMTP_PASS). Credentials logged above to console for development. To send live emails to real inboxes, add SMTP_USER & SMTP_PASS to backend/.env.`);
      return { success: true, localOnly: true };
    }

    const info = await mailClient.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html
    });
    console.log(`[EMAIL SUCCESS] Message sent to ${to}! Message ID: ${info?.messageId || 'SENT'}`);
    return { success: true, messageId: info?.messageId };
  } catch (err) {
    console.warn(`[EMAIL NOTICE] SMTP Delivery fallback (Credentials logged above):`, err.message);
    // Don't crash employee creation if external SMTP server is offline
    return { success: true, fallbackLogged: true, error: err.message };
  }
}

module.exports = {
  sendWelcomeCredentialsEmail
};
