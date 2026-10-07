// 📁 utility/SendEmailUtility.js
const nodemailer = require('nodemailer');
const { getFromAddress, getReplyToAddress } = require('../config/email');

let transporter;

async function SendEmailUtility(EmailTo, EmailSubject, EmailText, EmailHTML = null) {
    console.log('📧 SendEmailUtility called:', { 
        to: EmailTo, 
        subject: EmailSubject 
    });
    
    // Debug environment variables
    console.log('🔧 ENV Variables:', {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER,
        hasPassword: !!process.env.EMAIL_PASSWORD,
        secure: process.env.EMAIL_SECURE
    });

    try {
        // ✅ Correct Hostinger SMTP configuration
        transporter = transporter || nodemailer.createTransport({
            host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
            port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT, 10) || 465,
            secure: process.env.EMAIL_SECURE
                ? process.env.EMAIL_SECURE === 'true'
                : process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER || process.env.SMTP_USER,
                pass: process.env.EMAIL_PASSWORD || process.env.SMTP_PASS
            },
            tls: { rejectUnauthorized: false }
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM || `"Samudera Cargo Logistics" <${getFromAddress()}>`,
            to: EmailTo,
            replyTo: getReplyToAddress(),
            subject: EmailSubject,
            text: EmailText,
            html: EmailHTML || `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; text-align: center;">
                        <h1 style="margin: 0;">Samudera Cargo Logistics</h1>
                    </div>
                    <div style="padding: 30px; background: #f9f9f9;">
                        <h2>${EmailSubject}</h2>
                        <div style="white-space: pre-line; line-height: 1.6;">
                            ${EmailText.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    <div style="padding: 20px; background: #eee; text-align: center; font-size: 12px; color: #666;">
                        © ${new Date().getFullYear()} Samudera Cargo Logistics. All rights reserved.
                    </div>
                </div>
            `,
            // Important headers for deliverability
            headers: {
                'X-Priority': '1',
                'X-Mailer': 'Samudera Cargo Logistics'
            }
        };

        console.log('📤 Sending email...');
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email sent successfully!', {
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected
        });
        
        return {
            success: true,
            messageId: info.messageId,
            response: info.response
        };
        
    } catch (error) {
        console.error('❌ SMTP Error:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        
        // User-friendly error messages
        let userError = 'Failed to send email. Please try again.';
        
        if (error.code === 'EAUTH') {
            userError = 'Email authentication failed. Please check email credentials.';
        } else if (error.code === 'ECONNECTION') {
            userError = 'Cannot connect to email server. Please check your internet connection.';
        } else if (error.message.includes('Invalid login')) {
            userError = 'Invalid email credentials. Please check your email username and password.';
        }
        
        throw new Error(userError);
    }
}

module.exports = SendEmailUtility;