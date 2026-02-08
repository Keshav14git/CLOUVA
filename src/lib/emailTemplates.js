
export const getWelcomeTemplate = (name) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #18181b; background-color: #f4f4f5; margin: 0; padding: 0; }
        .container { max-width: 500px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7; }
        .header { padding: 32px; text-align: center; border-bottom: 1px solid #f4f4f5; }
        .logo-box { background: #dc2626; color: white; width: 40px; height: 40px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .logo-text { font-weight: 700; font-size: 18px; color: #18181b; display: block; letter-spacing: -0.5px; }
        .content { padding: 32px; }
        .h1 { font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #18181b; letter-spacing: -0.5px; }
        .p { margin-bottom: 24px; color: #52525b; font-size: 16px; }
        .btn { display: inline-block; background-color: #dc2626; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 8px; }
        .footer { padding: 24px; text-align: center; font-size: 12px; color: #a1a1aa; background: #fafafa; border-top: 1px solid #f4f4f5; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-text">CLOUVA</div>
        </div>
        <div class="content">
            <h1 class="h1">Welcome, ${name}</h1>
            <p class="p">Your secure knowledge vault has been initialized. You now have access to enterprise-grade indexing for your digital memory.</p>
            <p class="p">Start connecting your data sources to build your second brain.</p>
            <a href="http://localhost:5173/dashboard" class="btn">Access Terminal</a>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} Clouva Inc. Secure Knowledge Systems.
        </div>
    </div>
</body>
</html>
`;

export const getResetPasswordTemplate = (url) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #18181b; background-color: #f4f4f5; margin: 0; padding: 0; }
        .container { max-width: 500px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7; }
        .header { padding: 32px; text-align: center; border-bottom: 1px solid #f4f4f5; }
        .logo-text { font-weight: 700; font-size: 18px; color: #18181b; display: block; letter-spacing: -0.5px; }
        .content { padding: 32px; }
        .h1 { font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #18181b; letter-spacing: -0.5px; }
        .p { margin-bottom: 24px; color: #52525b; font-size: 16px; }
        .btn { display: inline-block; background-color: #dc2626; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 8px; }
        .footer { padding: 24px; text-align: center; font-size: 12px; color: #a1a1aa; background: #fafafa; border-top: 1px solid #f4f4f5; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-text">CLOUVA</div>
        </div>
        <div class="content">
            <h1 class="h1">Reset Access</h1>
            <p class="p">We received a request to reset the password for your Clouva ID. If you didn't ask for this, you can ignore this email.</p>
            <a href="${url}" class="btn">Reset Password</a>
        </div>
        <div class="footer">
            Seconds count. This link expires in 1 hour.
        </div>
    </div>
</body>
</html>
`;
