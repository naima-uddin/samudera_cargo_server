const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const isServerlessRuntime = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const invoicesDir = isServerlessRuntime
    ? path.join('/tmp', 'invoices')
    : path.join(__dirname, '../invoices');

const ensureInvoicesDir = () => {
    if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
    }
};

// Professional color scheme - Modern & Elegant
const COLORS = {
    primary: '#1e3c72',
    secondary: '#2a5298',
    accent: '#e67e22',
    gold: '#f39c12',
    border: '#e8ecf1',
    text: '#2c3e50',
    textLight: '#7f8c8d',
    header: '#f8f9fa',
    success: '#27ae60',
    bgLight: '#ffffff'
};

// Format currency
const formatCurrency = (amount, currency = 'USD') => {
    const safeAmount = Number(amount || 0);
    if (isNaN(safeAmount)) return `$0.00`;
    
    const currencySymbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'CAD': 'C$',
        'BDT': '৳',
        'INR': '₹'
    };
    
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${safeAmount.toFixed(2)}`;
};

// Format date
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Generate PDF invoice - Professional design strictly in 1 page
const generateInvoicePDF = async (shipment) => {
    return new Promise((resolve, reject) => {
        try {
            ensureInvoicesDir();

            const invoiceNumber = `INV-${shipment.shipmentNumber || `SHP-${Date.now()}`}`;
            const fileName = `${invoiceNumber}.pdf`;
            const filePath = path.join(invoicesDir, fileName);
            
            // Optimized margins for one-page layout
            const doc = new PDFDocument({ 
                margin: 20,
                size: 'A4',
                layout: 'portrait',
                info: {
                    Title: `Invoice ${invoiceNumber}`,
                    Author: 'Samudera Traffic Co., Ltd. Group'
                }
            });
            
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);
            
            let yPosition = doc.y;
            
            // ========== HEADER SECTION (COMPACT) ==========
            // Top decorative line
            doc.rect(20, yPosition, 555, 2).fill(COLORS.primary);
            yPosition += 6;
            
            // Company Logo Area - Compact
            doc.rect(20, yPosition, 100, 35).fill(COLORS.primary);
            doc.fillColor('white')
                .fontSize(13)
                .font('Helvetica-Bold')
                .text('CARGO', 30, yPosition + 5)
                .fontSize(7)
                .text('LOGISTICS GROUP', 30, yPosition + 22);
            
            // Company Info - Right aligned, compact
            doc.fillColor(COLORS.text)
                .fontSize(6.5)
                .font('Helvetica');
            
            doc.text('Samudera Traffic Co., Ltd. Group', 380, yPosition + 2, { align: 'right', width: 155 });
            doc.text('Green Tower, 9th floor, 3656/27-28
Rama IV Road, Klongton-Klong Toey
Bangkok 10110, Thailand', 380, yPosition + 10, { align: 'right', width: 155 });
            doc.text('Tel: +66977830395', 380, yPosition + 18, { align: 'right', width: 155 });
            
            // INVOICE Badge - Compact
            doc.rect(420, yPosition + 2, 95, 24).fill(COLORS.accent);
            doc.fillColor('white')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text('INVOICE', 430, yPosition + 8, { width: 75, align: 'center' });
            
            yPosition += 42;
            
            // ========== INVOICE INFO GRID (COMPACT) ==========
            // Invoice details card - more compact
            doc.rect(20, yPosition, 555, 50).fill(COLORS.header);
            
            // Left column
            doc.fillColor(COLORS.textLight)
                .fontSize(6)
                .font('Helvetica')
                .text('INVOICE NUMBER', 28, yPosition + 5);
            doc.fillColor(COLORS.text)
                .fontSize(7.5)
                .font('Helvetica-Bold')
                .text(invoiceNumber, 28, yPosition + 14);
            
            doc.fillColor(COLORS.textLight)
                .fontSize(6)
                .font('Helvetica')
                .text('INVOICE DATE', 28, yPosition + 26);
            doc.fillColor(COLORS.text)
                .fontSize(7)
                .font('Helvetica')
                .text(formatDate(new Date()), 28, yPosition + 34);
            
            // Middle column
            doc.fillColor(COLORS.textLight)
                .fontSize(6)
                .font('Helvetica')
                .text('DUE DATE', 180, yPosition + 5);
            doc.fillColor(COLORS.text)
                .fontSize(7.5)
                .font('Helvetica-Bold')
                .text(formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), 180, yPosition + 14);
            
            doc.fillColor(COLORS.textLight)
                .fontSize(6)
                .font('Helvetica')
                .text('TRACKING NO.', 180, yPosition + 26);
            doc.fillColor(COLORS.text)
                .fontSize(7)
                .font('Helvetica')
                .text(shipment.trackingNumber || 'N/A', 180, yPosition + 34);
            
            // Right column - Status badge
            doc.fillColor(COLORS.success)
                .fontSize(8)
                .font('Helvetica-Bold')
                .text('● PAID', 450, yPosition + 18);
            
            doc.fillColor(COLORS.textLight)
                .fontSize(6)
                .font('Helvetica')
                .text('Payment Terms: Net 30', 450, yPosition + 32);
            
            yPosition += 58;
            
            // ========== BILLING & SHIPPING SECTION (COMPACT) ==========
            // Bill To Section
            doc.rect(20, yPosition, 265, 62).fill(COLORS.header);
            doc.fillColor(COLORS.primary)
                .fontSize(7)
                .font('Helvetica-Bold')
                .text('BILL TO', 28, yPosition + 5);
            
            doc.fillColor(COLORS.text)
                .fontSize(5.5)
                .font('Helvetica');
            
            let billY = yPosition + 15;
            doc.text(shipment.sender?.name || 'N/A', 28, billY);
            billY += 7;
            if (shipment.sender?.companyName) {
                doc.text(shipment.sender.companyName, 28, billY);
                billY += 7;
            }
            doc.text(shipment.sender?.email || 'N/A', 28, billY);
            billY += 7;
            doc.text(shipment.sender?.phone || 'N/A', 28, billY);
            
            // Ship To Section
            doc.rect(295, yPosition, 280, 62).fill(COLORS.header);
            doc.fillColor(COLORS.primary)
                .fontSize(7)
                .font('Helvetica-Bold')
                .text('SHIP TO', 303, yPosition + 5);
            
            doc.fillColor(COLORS.text)
                .fontSize(5.5)
                .font('Helvetica');
            
            let shipY = yPosition + 15;
            doc.text(shipment.receiver?.name || 'N/A', 303, shipY);
            shipY += 7;
            if (shipment.receiver?.companyName) {
                doc.text(shipment.receiver.companyName, 303, shipY);
                shipY += 7;
            }
            doc.text(shipment.receiver?.email || 'N/A', 303, shipY);
            shipY += 7;
            doc.text(shipment.receiver?.phone || 'N/A', 303, shipY);
            
            yPosition += 69;
            
            // ========== SHIPMENT INFO - Compact ==========
            doc.rect(20, yPosition, 555, 35).fill(COLORS.bgLight);
            doc.strokeColor(COLORS.border)
                .lineWidth(0.5)
                .rect(20, yPosition, 555, 35)
                .stroke();
            
            // Shipment details grid - single row
            const infoItems = [
                { label: 'Shipment #', value: shipment.shipmentNumber || 'N/A', x: 28 },
                { label: 'Service Type', value: shipment.serviceType?.toUpperCase() || 'N/A', x: 155 },
                { label: 'Origin', value: shipment.shipmentDetails?.origin || 'N/A', x: 285 },
                { label: 'Destination', value: shipment.shipmentDetails?.destination || 'N/A', x: 415 }
            ];
            
            doc.fillColor(COLORS.textLight)
                .fontSize(5)
                .font('Helvetica');
            
            infoItems.forEach(item => {
                doc.text(item.label, item.x, yPosition + 4);
                doc.fillColor(COLORS.text)
                    .fontSize(6)
                    .font('Helvetica-Bold')
                    .text(item.value, item.x, yPosition + 11);
                doc.fillColor(COLORS.textLight)
                    .fontSize(5)
                    .font('Helvetica');
            });
            
            doc.fillColor(COLORS.textLight)
                .fontSize(5)
                .font('Helvetica')
                .text('Shipment Date', 28, yPosition + 22);
            doc.fillColor(COLORS.text)
                .fontSize(6)
                .font('Helvetica-Bold')
                .text(formatDate(shipment.createdAt || new Date()), 28, yPosition + 29);
            
            yPosition += 42;
            
            // ========== PRICE BREAKDOWN / PACKAGE DETAILS (COMPACT) ==========
            const breakdown = shipment.quotedPrice?.breakdown || {};
            const breakdownItems = [
                { key: 'baseRate', label: 'Base shipping rate', type: 'Freight Cost' },
                { key: 'weightCharge', label: 'Weight-based charge', type: 'Weight Charge' },
                { key: 'fuelSurcharge', label: 'Fuel surcharge', type: 'Fuel Surcharge' },
                { key: 'residentialSurcharge', label: 'Residential surcharge', type: 'Residential' },
                { key: 'insurance', label: 'Cargo insurance', type: 'Insurance' }
            ].filter(item => Number(breakdown[item.key] || 0) > 0);

            const hasPriceBreakdown = breakdownItems.length > 0;
            const packages = shipment.shipmentDetails?.packageDetails || [];
            const totalQty = packages.reduce((sum, pkg) => sum + (pkg.quantity || 1), 0);
            const subtotal = Number(shipment.quotedPrice?.amount || 0);
            const unitPrice = totalQty > 0 ? subtotal / totalQty : 0;

            doc.fillColor(COLORS.primary)
                .fontSize(8)
                .font('Helvetica-Bold')
                .text(hasPriceBreakdown ? 'PRICE BREAKDOWN' : 'PACKAGE DETAILS', 20, yPosition);
            
            yPosition += 9;

            const tableX = 20;
            const tableWidths = hasPriceBreakdown ? {
                description: 250,
                type: 150,
                amount: 140
            } : {
                description: 210,
                qty: 45,
                weight: 65,
                unitPrice: 90,
                total: 90
            };
            
            let currentX = tableX;
            doc.rect(tableX, yPosition, 555, 16).fill(COLORS.primary);
            doc.fillColor('white').fontSize(6).font('Helvetica-Bold');

            if (hasPriceBreakdown) {
                doc.text('DESCRIPTION', currentX + 5, yPosition + 4);
                currentX += tableWidths.description;
                doc.text('TYPE', currentX + 5, yPosition + 4);
                currentX += tableWidths.type;
                doc.text('AMOUNT', currentX + 5, yPosition + 4, { align: 'right' });

                yPosition += 16;

                let rowCount = 0;
                breakdownItems.slice(0, 3).forEach((item) => {
                    const amount = Number(breakdown[item.key] || 0);

                    if (rowCount % 2 === 0) {
                        doc.rect(tableX, yPosition, 555, 12).fill(COLORS.header);
                    }

                    currentX = tableX;
                    doc.fillColor(COLORS.text)
                        .fontSize(5.5)
                        .font('Helvetica')
                        .text(item.label.substring(0, 35), currentX + 5, yPosition + 1);
                    currentX += tableWidths.description;

                    doc.text(item.type.substring(0, 18), currentX + 5, yPosition + 1);
                    currentX += tableWidths.type;

                    doc.text(formatCurrency(amount, shipment.quotedPrice?.currency), currentX + 5, yPosition + 1, { align: 'right' });

                    yPosition += 12;
                    rowCount++;
                });
            } else {
                doc.text('DESCRIPTION', currentX + 5, yPosition + 4);
                currentX += tableWidths.description;
                doc.text('QTY', currentX + 10, yPosition + 4, { align: 'center' });
                currentX += tableWidths.qty;
                doc.text('WT', currentX + 15, yPosition + 4, { align: 'center' });
                currentX += tableWidths.weight;
                doc.text('UNIT PRICE', currentX + 5, yPosition + 4, { align: 'right' });
                currentX += tableWidths.unitPrice;
                doc.text('TOTAL', currentX + 5, yPosition + 4, { align: 'right' });

                yPosition += 16;

                let rowCount = 0;
                packages.slice(0, 2).forEach((pkg) => {
                    if (rowCount >= 2) return;

                    const description = pkg.description || 'Package';
                    const quantity = pkg.quantity || 1;
                    const weight = pkg.weight || 0;
                    const total = unitPrice * quantity;

                    if (rowCount % 2 === 0) {
                        doc.rect(tableX, yPosition, 555, 11).fill(COLORS.header);
                    }

                    currentX = tableX;
                    doc.fillColor(COLORS.text)
                        .fontSize(5.5)
                        .font('Helvetica')
                        .text(description.substring(0, 30), currentX + 5, yPosition + 1);
                    currentX += tableWidths.description;

                    doc.text(quantity.toString(), currentX + 10, yPosition + 1, { align: 'center' });
                    currentX += tableWidths.qty;

                    doc.text(weight.toFixed(1), currentX + 15, yPosition + 1, { align: 'center' });
                    currentX += tableWidths.weight;

                    doc.text(formatCurrency(unitPrice, shipment.quotedPrice?.currency), currentX + 5, yPosition + 1, { align: 'right' });
                    currentX += tableWidths.unitPrice;

                    doc.text(formatCurrency(total, shipment.quotedPrice?.currency), currentX + 5, yPosition + 1, { align: 'right' });

                    yPosition += 11;
                    rowCount++;
                });

                if (packages.length === 0) {
                    doc.rect(tableX, yPosition, 555, 11).fill(COLORS.header);
                    doc.fillColor(COLORS.textLight)
                        .fontSize(5.5)
                        .font('Helvetica')
                        .text('No package details available', tableX + 5, yPosition + 1);
                    yPosition += 11;
                }
            }
            
            yPosition += 3;
            
            // ========== SUMMARY SECTION (COMPACT) ==========
            const tax = subtotal * 0.10;
            const total = subtotal + tax;
            
            // Summary Box - Compact
            const summaryX = 340;
            const summaryY = yPosition;
            
            doc.rect(summaryX, summaryY, 215, 60).fill(COLORS.header);
            doc.strokeColor(COLORS.border)
                .lineWidth(0.5)
                .rect(summaryX, summaryY, 215, 60)
                .stroke();
            
            doc.fillColor(COLORS.text)
                .fontSize(6)
                .font('Helvetica');
            
            doc.text('Subtotal:', summaryX + 12, summaryY + 8);
            doc.text(formatCurrency(subtotal, shipment.quotedPrice?.currency), summaryX + 200, summaryY + 8, { align: 'right' });
            
            // Total line
            doc.strokeColor(COLORS.gold)
                .lineWidth(1)
                .moveTo(summaryX + 8, summaryY + 33)
                .lineTo(summaryX + 210, summaryY + 33)
                .stroke();
            
            doc.fillColor(COLORS.primary)
                .fontSize(8)
                .font('Helvetica-Bold')
                .text('TOTAL:', summaryX + 12, summaryY + 38);
            doc.fillColor(COLORS.accent)
                .fontSize(9)
                .font('Helvetica-Bold')
                .text(formatCurrency(total, shipment.quotedPrice?.currency), summaryX + 200, summaryY + 38, { align: 'right' });
            
            yPosition += 65;
            
            // ========== FOOTER SECTION ==========
            if (yPosition <= 730) {
                // Decorative line
                doc.strokeColor(COLORS.border)
                    .lineWidth(0.5)
                    .moveTo(20, yPosition)
                    .lineTo(575, yPosition)
                    .stroke();
                
                yPosition += 6;
                
                // Thank You Message
                doc.fillColor(COLORS.accent)
                    .fontSize(7)
                    .font('Helvetica-Bold')
                    .text('Thank you for your business!', 20, yPosition, { align: 'center', width: 555 });
                
                doc.fillColor(COLORS.textLight)
                    .fontSize(5)
                    .font('Helvetica')
                    .text('This is a computer generated invoice. No signature required.', 20, yPosition + 8, { align: 'center', width: 555 });
            }
            
            doc.end();
            
            stream.on('finish', () => {
                resolve({
                    path: filePath,
                    filename: fileName,
                    invoiceNumber,
                    filePath: filePath
                });
            });
            
            stream.on('error', reject);
            
        } catch (error) {
            reject(error);
        }
    });
};

// Save invoice record to database
const saveInvoiceRecord = async (shipment, invoiceDetails) => {
    return {
        shipmentId: shipment._id,
        shipmentNumber: shipment.shipmentNumber,
        invoiceNumber: invoiceDetails.invoiceNumber,
        invoiceDate: new Date(),
        amount: shipment.quotedPrice?.amount || 0,
        currency: shipment.quotedPrice?.currency || 'USD',
        status: 'generated',
        pdfPath: invoiceDetails.path,
        customerEmail: shipment.sender?.email,
        customerName: shipment.sender?.name,
        trackingNumber: shipment.trackingNumber
    };
};

module.exports = {
    generateInvoicePDF,
    saveInvoiceRecord,
    invoicesDir
};