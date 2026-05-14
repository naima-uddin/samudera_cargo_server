// utils/emailService.js
const nodemailer = require('nodemailer');
const path = require('path');

// Create transporter for Hostinger
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ SMTP Connection Error:', {
            message: error.message,
            code: error.code,
            command: error.command
        });
    } else {
        console.log('✅ SMTP Server is ready to send emails');
        console.log(`📧 From: ${process.env.EMAIL_FROM}`);
        console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
    }
});
// Email templates
const getFrontendUrl = () => {
    return (process.env.FRONTEND_URL || process.env.CLIENT_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || '').replace(/\/$/, '');
};

const getSenderEmailTemplate = (shipment) => {
    const frontendUrl = getFrontendUrl();
    const trackingLink = frontendUrl
        ? `${frontendUrl}/tracking-number/${encodeURIComponent(shipment.trackingNumber || '')}`
        : `/tracking-number/${encodeURIComponent(shipment.trackingNumber || '')}`;
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1a56db; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9fafb; }
                .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
                .tracking-btn {
  display: inline-block;
  background: #F56602; /* red */
  color: white;
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 5px;
  margin: 20px 0;
}
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body> 
            <div class="container">
                <div class="header">
                    <h1>Shipment Created Successfully</h1>
                </div>
                <div class="content">
                    <h2>Dear ${shipment.sender?.name || 'Customer'},</h2>
                    <p>Your shipment has been successfully created and is now being processed. You can track it clicking the button below.</p>
                    
                    <div class="details">
                        <h3>Shipment Details:</h3>
                        <p><strong>Shipment Number:</strong> ${shipment.shipmentNumber}</p>
                        <p><strong>Tracking Number:</strong> ${shipment.trackingNumber}</p>
                        <p><strong>Service Type:</strong> ${shipment.serviceType}</p>
                        <p><strong>Origin:</strong> ${shipment.shipmentDetails?.origin}</p>
                        <p><strong>Destination:</strong> ${shipment.shipmentDetails?.destination}</p>
                        <p><strong>Estimated Delivery:</strong> ${shipment.dates?.estimatedArrival ? new Date(shipment.dates.estimatedArrival).toLocaleDateString() : 'To be confirmed'}</p>
                    </div>
                    
                    <div class="details">
                        <h3>Package Details:</h3>
                        ${shipment.shipmentDetails?.packageDetails?.map(pkg => `
                            <p><strong>${pkg.description || 'Package'}:</strong> ${pkg.quantity} x ${pkg.weight}kg</p>
                        `).join('') || '<p>No package details available</p>'}
                    </div>
                    
                    ${(() => {
                        const hasTransport = shipment.transport?.vesselName || shipment.transport?.voyageNumber;
                        const containers = shipment.containers || [];
                        if (!hasTransport && containers.length === 0) return '';
                        return `
                    <div class="details">
                        <h3>Transport &amp; Container Details:</h3>
                        ${shipment.transport?.vesselName ? `<p><strong>Vessel Name:</strong> ${shipment.transport.vesselName}</p>` : ''}
                        ${shipment.transport?.voyageNumber ? `<p><strong>Voyage Number:</strong> ${shipment.transport.voyageNumber}</p>` : ''}
                        ${containers.map((c, i) => `
                            ${containers.length > 1 ? `<p><strong>Container ${i + 1}:</strong></p>` : ''}
                            ${c.containerNumber ? `<p><strong>Container Number:</strong> ${c.containerNumber}</p>` : ''}
                            ${c.sealNumber ? `<p><strong>Seal Number:</strong> ${c.sealNumber}</p>` : ''}
                            ${c.blNumber ? `<p><strong>BL Number:</strong> ${c.blNumber}</p>` : ''}
                        `).join('')}
                    </div>`;
                    })()}
                    
                    <center>
                        <a href="${trackingLink}" class="tracking-btn">Track Your Shipment</a>
                    </center>
                    
                    <p>You can track your shipment anytime using the tracking number: <strong>${shipment.trackingNumber}</strong></p>
                    <p>For any questions, please contact our support team.</p>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Samudera Traffic Co., Ltd. Group. All rights reserved.</p>
                    <p>This is an automated message, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

const getReceiverEmailTemplate = (shipment) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #10b981; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9fafb; }
                .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Your Parcel is On The Way!</h1>
                </div>
                <div class="content">
                    <h2>Dear ${shipment.receiver?.name || 'Customer'},</h2>
                    <p>We're pleased to inform you that a parcel has been dispatched to you.</p>
                    
                    <div class="details">
                        <h3>Shipment Details:</h3>
                        <p><strong>Shipment Number:</strong> ${shipment.shipmentNumber}</p>
                        <p><strong>Tracking Number:</strong> ${shipment.trackingNumber}</p>
                        <p><strong>Origin:</strong> ${shipment.shipmentDetails?.origin}</p>
                        <p><strong>Destination:</strong> ${shipment.shipmentDetails?.destination}</p>
                        <p><strong>Estimated Delivery:</strong> ${shipment.dates?.estimatedArrival ? new Date(shipment.dates.estimatedArrival).toLocaleDateString() : 'To be confirmed'}</p>
                    </div>
                    
                    ${(() => {
                        const hasTransport = shipment.transport?.vesselName || shipment.transport?.voyageNumber;
                        const containers = shipment.containers || [];
                        if (!hasTransport && containers.length === 0) return '';
                        return `
                    <div class="details">
                        <h3>Transport &amp; Container Details:</h3>
                        ${shipment.transport?.vesselName ? `<p><strong>Vessel Name:</strong> ${shipment.transport.vesselName}</p>` : ''}
                        ${shipment.transport?.voyageNumber ? `<p><strong>Voyage Number:</strong> ${shipment.transport.voyageNumber}</p>` : ''}
                        ${containers.map((c, i) => `
                            ${containers.length > 1 ? `<p><strong>Container ${i + 1}:</strong></p>` : ''}
                            ${c.containerNumber ? `<p><strong>Container Number:</strong> ${c.containerNumber}</p>` : ''}
                            ${c.sealNumber ? `<p><strong>Seal Number:</strong> ${c.sealNumber}</p>` : ''}
                            ${c.blNumber ? `<p><strong>BL Number:</strong> ${c.blNumber}</p>` : ''}
                        `).join('')}
                    </div>`;
                    })()}
                    
                    <p>You can track your parcel using the tracking number: <strong>${shipment.trackingNumber}</strong></p>
                    <p>For any questions about delivery, please contact our support team.</p>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Samudera Traffic Co., Ltd. Group. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

const getAdminEmailTemplate = (shipment) => {
    const adminUrl = process.env.EMAIL_REPLY_TO || 'https://samuderathai.com/admin';
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9fafb; }
                .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
                .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>New Shipment Created</h1>
                </div>
                <div class="content">
                    <div class="alert">
                        <strong>⚠️ Action Required:</strong> A new shipment has been created and requires processing.
                    </div>
                    
                    <div class="details">
                        <h3>Shipment Information:</h3>
                        <p><strong>Shipment Number:</strong> ${shipment.shipmentNumber}</p>
                        <p><strong>Tracking Number:</strong> ${shipment.trackingNumber}</p>
                        <p><strong>Service Type:</strong> ${shipment.serviceType}</p>
                        <p><strong>Status:</strong> ${shipment.shipmentStatus}</p>
                        <p><strong>Created By:</strong> ${shipment.createdBy || 'System'}</p>
                        <p><strong>Created At:</strong> ${new Date(shipment.createdAt).toLocaleString()}</p>
                    </div>
                    
                    <div class="details">
                        <h3>Sender Information:</h3>
                        <p><strong>Name:</strong> ${shipment.sender?.name || 'N/A'}</p>
                        <p><strong>Email:</strong> ${shipment.sender?.email || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${shipment.sender?.phone || 'N/A'}</p>
                    </div>
                    
                    <div class="details">
                        <h3>Receiver Information:</h3>
                        <p><strong>Name:</strong> ${shipment.receiver?.name || 'N/A'}</p>
                        <p><strong>Email:</strong> ${shipment.receiver?.email || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${shipment.receiver?.phone || 'N/A'}</p>
                    </div>
                    
                    ${(() => {
                        const hasTransport = shipment.transport?.vesselName || shipment.transport?.voyageNumber;
                        const containers = shipment.containers || [];
                        if (!hasTransport && containers.length === 0) return '';
                        return `
                    <div class="details">
                        <h3>Transport &amp; Container Details:</h3>
                        ${shipment.transport?.vesselName ? `<p><strong>Vessel Name:</strong> ${shipment.transport.vesselName}</p>` : ''}
                        ${shipment.transport?.voyageNumber ? `<p><strong>Voyage Number:</strong> ${shipment.transport.voyageNumber}</p>` : ''}
                        ${containers.map((c, i) => `
                            ${containers.length > 1 ? `<p><strong>Container ${i + 1}:</strong></p>` : ''}
                            ${c.containerNumber ? `<p><strong>Container Number:</strong> ${c.containerNumber}</p>` : ''}
                            ${c.sealNumber ? `<p><strong>Seal Number:</strong> ${c.sealNumber}</p>` : ''}
                            ${c.blNumber ? `<p><strong>BL Number:</strong> ${c.blNumber}</p>` : ''}
                        `).join('')}
                    </div>`;
                    })()}
                    
                    <div class="details">
                        <h3>Financial Information:</h3>
                        <p><strong>Quoted Amount:</strong> ${shipment.quotedPrice?.currency || 'USD'} ${shipment.quotedPrice?.amount || 0}</p>
                        <p><strong>Payment Mode:</strong> ${shipment.payment?.mode || 'Not specified'}</p>
                    </div>
                    
                    
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Samudera Traffic Co., Ltd. Group. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

// Send email function
const normalizeRecipientList = (value) => {
    if (!value) return null;
    const list = Array.isArray(value) ? value : [value];
    const normalized = list
        .map(email => typeof email === 'string' ? email.trim().toLowerCase() : null)
        .filter(Boolean);
    return normalized.length ? normalized : null;
};

const sendEmail = async (to, subject, html, attachments = [], options = {}) => {
    try {
        const toRecipients = normalizeRecipientList(to);
        const ccRecipients = normalizeRecipientList(options.cc);
        const bccRecipients = normalizeRecipientList(options.bcc);

        const fallbackTo = normalizeRecipientList(process.env.EMAIL_FROM)
            || normalizeRecipientList(process.env.SMTP_USER);

        const recipients = toRecipients || fallbackTo;

        if (!recipients && !bccRecipients && !ccRecipients) {
            console.error('❌ No recipients provided for email');
            return false;
        }

        const mailOptions = {
            from: `"Samudera Traffic Co., Ltd." <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
            to: recipients || undefined,
            cc: ccRecipients || undefined,
            bcc: bccRecipients || undefined,
            replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.ADMIN_DEFAULT_EMAIL,
            subject,
            html,
            text: options.text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
            attachments
        };
        
        console.log('📧 Sending email', {
            to: mailOptions.to,
            cc: mailOptions.cc,
            bcc: mailOptions.bcc,
            subject
        });

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent:`, {
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected
        });
        const accepted = Array.isArray(info.accepted) ? info.accepted : [];
        return accepted.length > 0;
    } catch (error) {
        console.error('❌ Failed to send email:', {
            to,
            cc: options.cc,
            bcc: options.bcc,
            error: error.message
        });
        return false;
    }
};

module.exports = {
    sendEmail,
    getSenderEmailTemplate,
    getReceiverEmailTemplate,
    getAdminEmailTemplate
};