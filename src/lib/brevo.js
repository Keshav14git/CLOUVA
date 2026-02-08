
import { getWelcomeTemplate } from './emailTemplates';

const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY;
const SENDER_EMAIL = 'noreply@clouva.ai'; // You should verify this domain in Brevo, or use the email you signed up with
const SENDER_NAME = 'Clouva Security';

export const sendEmail = async ({ to, subject, htmlContent }) => {
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: SENDER_NAME, email: SENDER_EMAIL },
                to: [{ email: to }],
                subject: subject,
                htmlContent: htmlContent
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to send email');
        }

        return { success: true };
    } catch (error) {
        console.error('Brevo Email Error:', error);
        return { success: false, error: error.message };
    }
};

export const sendWelcomeEmail = async (email, name) => {
    const htmlContent = getWelcomeTemplate(name);
    return sendEmail({
        to: email,
        subject: 'Welcome to Clouva - Your Vault is Ready',
        htmlContent
    });
};
