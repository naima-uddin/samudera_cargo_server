// service/pdfGenerator.js
const PDFDocument = require('pdfkit');

async function generateInvoicePDFBuffer(invoice, companyInfo, trackingNumber) {
    return new Promise((resolve, reject) => {
        try {
            console.log('📄 Starting PDF generation for invoice:', invoice.invoiceNumber);

         const resolvedTrackingNumber =
            trackingNumber ||
            invoice.trackingNumber ||
            invoice.booking?.trackingNumber ||
            invoice.bookingId?.trackingNumber ||
            'N/A';
            
            const doc = new PDFDocument({ 
                margin: 50,
                size: 'A4',
                layout: 'portrait'
            });
            
            const buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                console.log('✅ PDF generated, size:', pdfBuffer.length);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);
            
            // ========== COLOR DEFINITIONS ==========
            const colors = {
               primary: '#0f172a',
               secondary: '#1e293b',
               accent: '#0f766e',
               success: '#15803d',
               danger: '#b91c1c',
               warning: '#b45309',
               text: '#111827',
               textLight: '#6b7280',
               border: '#d1d5db',
               background: '#f8fafc',
               muted: '#eef2f7'
            };

            const getCurrencySymbol = (currency = 'USD') => ({
               GBP: '£',
               USD: '$',
               EUR: '€',
               BDT: '৳',
               CAD: 'C$'
            }[currency] || currency);

            const formatMoney = (amount, currency = invoice.currency || 'USD') => {
               const safeAmount = Number(amount || 0);
               return `${getCurrencySymbol(currency)}${safeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            };
            
            // ========== HEADER SECTION ==========
            doc.rect(0, 0, doc.page.width, 95).fill(colors.primary);
            
            doc.fillColor('white')
               .fontSize(23)
               .font('Helvetica-Bold')
               .text(companyInfo?.name || 'Samudera Traffic Co., Ltd.', 50, 28);
            
            doc.fontSize(9)
               .font('Helvetica')
               .text(companyInfo?.address || 'Green Tower, 9th floor, 3656/27-28 Rama IV Road', 50, 56)
               .text(companyInfo?.city || 'Klongton-Klong Toey Bangkok 10110, Thailand', 50, 69)
               .text(`Phone: ${companyInfo?.phone || '+66977830395'}`, 50, 82);
            
            doc.fillColor(colors.accent)
               .rect(doc.page.width - 175, 28, 125, 42)
               .fill();
            
            doc.fillColor('white')
               .fontSize(17)
               .font('Helvetica-Bold')
               .text('INVOICE', doc.page.width - 168, 43);
            
            // ========== INVOICE INFO SECTION ==========
            let y = 112;
            
            doc.fillColor(colors.muted)
               .roundedRect(50, y, 220, 84, 8)
               .fill();
            
            doc.fillColor(colors.secondary)
               .roundedRect(280, y, 265, 84, 8)
               .fill();
            
            doc.fillColor(colors.text)
               .fontSize(9)
               .font('Helvetica-Bold')
               .text('INVOICE NUMBER', 62, y + 12);
            
            doc.fillColor(colors.primary)
               .fontSize(12)
               .font('Helvetica-Bold')
               .text(invoice.invoiceNumber || 'N/A', 62, y + 30);
            
            doc.fillColor(colors.text)
               .fontSize(9)
               .font('Helvetica-Bold')
               .text('INVOICE DATE', 62, y + 52);
            
            doc.fillColor(colors.text)
               .fontSize(10)
               .font('Helvetica')
               .text(new Date(invoice.invoiceDate).toLocaleDateString('en-US', {
                   year: 'numeric',
                   month: 'long',
                   day: 'numeric'
               }), 62, y + 66);
            
            doc.fillColor('white')
               .fontSize(9)
               .font('Helvetica-Bold')
               .text('DUE DATE', 295, y + 12);
            
            doc.fillColor('white')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text(new Date(invoice.dueDate).toLocaleDateString('en-US', {
                   year: 'numeric',
                   month: 'long',
                   day: 'numeric'
               }), 295, y + 30);
            
            doc.fillColor('white')
               .fontSize(9)
               .font('Helvetica-Bold')
               .text('PAYMENT STATUS', 295, y + 53);
            
            const statusColor = invoice.paymentStatus === 'paid' ? colors.success : 
                               invoice.paymentStatus === 'overdue' ? colors.danger : colors.warning;
            
            doc.fillColor(statusColor)
               .roundedRect(295, y + 64, 92, 16, 4)
               .fill();
            
            doc.fillColor('white')
               .fontSize(8)
               .font('Helvetica-Bold')
               .text((invoice.paymentStatus || 'pending').toUpperCase(), 295, y + 68, {
                   width: 92,
                   align: 'center'
               });
            
            y += 96;
            
            // ========== BILL TO SECTION ==========
            doc.fillColor(colors.secondary)
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('BILL TO', 50, y);
            y += 16;

           
            
            doc.fillColor(colors.muted)
               .roundedRect(50, y, 495, 72, 8)
               .fill();
            
            doc.fillColor(colors.text)
               .fontSize(11)
               .font('Helvetica-Bold')
               .text(invoice.customerInfo?.contactPerson || 'Customer Name', 65, y + 11);
            
            doc.fontSize(9)
               .font('Helvetica')
               .fillColor(colors.text)
               .text(invoice.customerInfo?.companyName || '', 65, y + 28)
               .text(invoice.customerInfo?.email || '', 65, y + 42)
               .text(invoice.customerInfo?.phone || '', 65, y + 56);

            doc.fillColor(colors.text)
               .fontSize(9)
               .font('Helvetica-Bold')
               .text('Tracking Number', 365, y + 18, {
                   width: 160,
                   align: 'right'
               });

            doc.fillColor(colors.accent)
               .fontSize(10)
               .font('Helvetica-Bold')
               .text(resolvedTrackingNumber, 365, y + 34, {
                   width: 160,
                   align: 'right'
               });
            
            y += 86;
            
            // ========== CHARGES TABLE ==========
            doc.fillColor(colors.secondary)
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('CHARGES BREAKDOWN', 50, y);
            y += 16;
            
            doc.fillColor(colors.primary)
               .roundedRect(50, y, 495, 22, 5)
               .fill();
            
            doc.fillColor('white')
               .fontSize(8)
               .font('Helvetica-Bold')
               .text('DESCRIPTION', 60, y + 7)
               .text('TYPE', 280, y + 7)
               .text('AMOUNT', doc.page.width - 120, y + 7, {
                   width: 70,
                   align: 'right'
               });
            
            y += 24;
            
            // Support fallbacks from booking/quote payloads if invoice fields are missing
            const quotedAmount = Number(
                invoice.quotedPrice ||
                invoice.subtotalQuote ||
                invoice.booking?.quotedPrice ||
                invoice.booking?.quote?.total ||
                invoice.booking?.totalPrice ||
                0
            );

            // Build charges array from multiple possible sources and normalize shape
            const chargesSource =
                invoice.charges ||
                invoice.booking?.charges ||
                invoice.costBreakdown ||
                invoice.quote?.breakdown ||
                [];

            const charges = Array.isArray(chargesSource)
                ? chargesSource.map(ch => ({
                      description: ch.description || ch.name || ch.label || 'Charge',
                      type: ch.type || ch.category || '',
                      amount: Number(ch.amount || ch.value || ch.price || ch.total || 0),
                      currency: ch.currency || invoice.currency || 'USD'
                  }))
                : [];

            const rowHeight = 18;
            let totalCharges = 0;
            let rowColor = true;

            const maxTableBottom = 595;
            const maxRows = Math.max(0, Math.floor((maxTableBottom - y) / rowHeight));
            const visibleCharges = charges.slice(0, maxRows);

            if (visibleCharges.length > 0) {
                for (const charge of visibleCharges) {
                    const amount = Number(charge.amount || 0);
                    totalCharges += amount;

                    if (rowColor) {
                        doc.fillColor(colors.background)
                           .rect(50, y, 495, rowHeight)
                           .fill();
                    }

                    doc.fillColor(colors.text)
                       .fontSize(8.5)
                       .font('Helvetica')
                       .text(charge.description || '-', 60, y + 5, {
                           width: 210,
                           ellipsis: true
                       })
                       .text(charge.type || '-', 280, y + 5, {
                           width: 120,
                           ellipsis: true
                       })
                       .text(
                           formatMoney(amount, charge.currency || invoice.currency || 'USD'),
                           doc.page.width - 120,
                           y + 5,
                           {
                               width: 70,
                               align: 'right',
                               lineBreak: false
                           }
                       );

                    y += rowHeight;
                    rowColor = !rowColor;
                }

                if (charges.length > visibleCharges.length) {
                    doc.fillColor(colors.textLight)
                       .fontSize(8)
                       .font('Helvetica-Oblique')
                       .text(`+${charges.length - visibleCharges.length} more charge(s) not shown`, 60, y + 4);
                    y += 14;

                    for (let i = visibleCharges.length; i < charges.length; i += 1) {
                        totalCharges += Number(charges[i].amount || 0);
                    }
                }
            } else {
                doc.fillColor(colors.textLight)
                   .fontSize(9)
                   .text('No charges available', 60, y + 5);
                y += rowHeight;
            }
            
            // ========== SUMMARY SECTION ==========
            y += 10;
            
            const summaryWidth = 215;
            const summaryX = doc.page.width - summaryWidth - 50;

            const discount = Number(invoice.discountAmount || 0);
            const tax = Number(invoice.taxAmount || 0);
            const subtotal = totalCharges;
            const finalTotal = subtotal - discount + tax;

            const summaryRows = [
                { label: 'SUBTOTAL', value: formatMoney(subtotal, invoice.currency || 'USD') }
            ];

            if (discount > 0) {
                summaryRows.push({
                    label: 'DISCOUNT',
                    value: `-${formatMoney(discount, invoice.currency || 'USD')}`,
                    valueColor: colors.success
                });
            }

            if (tax > 0) {
                summaryRows.push({ label: 'TAX', value: formatMoney(tax, invoice.currency || 'USD') });
            }

            const summaryHeight = Math.max(86, 52 + (summaryRows.length - 1) * 18);
            doc.fillColor(colors.background)
               .roundedRect(summaryX, y, summaryWidth, summaryHeight, 8)
               .fill();

            let summaryY = y + 15;

            const rightAlign = (text, yPos, bold = false, color = colors.text) => {
                doc.fillColor(color)
                   .fontSize(bold ? 10 : 9)
                   .font(bold ? 'Helvetica-Bold' : 'Helvetica')
                   .text(text, summaryX + 10, yPos, {
                       width: summaryWidth - 20,
                       align: 'right',
                       lineBreak: false
                   });
            };

            for (const row of summaryRows) {
                doc.fillColor(colors.text)
                   .fontSize(9)
                   .font('Helvetica')
                   .text(row.label, summaryX + 12, summaryY);

                rightAlign(row.value, summaryY, false, row.valueColor || colors.text);
                summaryY += 18;
            }

            doc.strokeColor(colors.border)
               .lineWidth(1)
               .moveTo(summaryX + 12, summaryY + 2)
               .lineTo(summaryX + summaryWidth - 12, summaryY + 2)
               .stroke();

            summaryY += 12;

            doc.fillColor(colors.secondary)
               .fontSize(11)
               .font('Helvetica-Bold')
               .text('TOTAL', summaryX + 12, summaryY);

            doc.fillColor(colors.accent)
               .fontSize(16)
               .font('Helvetica-Bold')
               .text(
                  formatMoney(invoice.totalAmount || finalTotal, invoice.currency || 'USD'),
                   summaryX + 12,
                   summaryY,
                   {
                       width: summaryWidth - 24,
                       align: 'right',
                       lineBreak: false
                   }
               );
            
            // ========== FOOTER SECTION ==========
            const footerY = Math.max(y + summaryHeight + 20, 692);
            
            doc.moveTo(50, footerY)
               .lineTo(doc.page.width - 50, footerY)
               .stroke(colors.border);
            
            doc.fillColor(colors.textLight)
               .fontSize(8)
               .font('Helvetica')
               .text(invoice.paymentTerms || 'Due within 30 days', 50, footerY + 10);

            doc.text('* Amounts are based on the quoted price breakdown and may include all service components.', 50, footerY + 22, {
               width: 420
            });
            
            if (invoice.termsAndConditions) {
               doc.text(invoice.termsAndConditions, 50, footerY + 35, {
                    width: 400
                });
            }
            
            doc.fillColor(colors.accent)
               .fontSize(10)
               .font('Helvetica-Bold')
               .text('Thank you for your business!', 50, footerY + 60);
            
            doc.fillColor(colors.textLight)
               .fontSize(8)
               .font('Helvetica')
               .text(`Page 1 of 1`, doc.page.width - 100, footerY + 60, { align: 'right' });
            
            doc.end();
            
        } catch (error) {
            console.error('❌ PDF generation error:', error);
            reject(error);
        }
    });
}

module.exports = { generateInvoicePDFBuffer };