const ManualInvoice = require('../models/ManualInvoice');
const fs = require('fs');
const path = require('path');

// ==================== GET ALL INVOICES ====================
exports.getManualInvoices = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        
        // Build filter
        let filter = {};
        if (status) filter.status = status;
        
        if (search) {
            filter.$or = [
                { invoiceNumber: new RegExp(search, 'i') },
                { shipmentNumber: new RegExp(search, 'i') },
                { 'customerInfo.name': new RegExp(search, 'i') },
                { 'customerInfo.email': new RegExp(search, 'i') }
            ];
        }
        
        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);
        
        // Get invoices
        const invoices = await ManualInvoice.find(filter)
            .populate('shipmentId', 'trackingNumber')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        
        // Get total count
        const total = await ManualInvoice.countDocuments(filter);
        
        // Calculate summary
        const summary = {
            total: total,
            paid: await ManualInvoice.countDocuments({ status: 'paid' }),
            pending: await ManualInvoice.countDocuments({ status: { $in: ['generated', 'sent'] } }),
            overdue: await ManualInvoice.countDocuments({ 
                status: { $ne: 'paid' },
                dueDate: { $lt: new Date() }
            }),
            totalAmount: await ManualInvoice.aggregate([
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]).then(result => result[0]?.total || 0)
        };
        
        res.status(200).json({
            success: true,
            data: invoices,
            summary: summary,
            pagination: {
                total,
                page: parseInt(page),
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            },
            message: 'Invoices fetched successfully'
        });
        
    } catch (error) {
        console.error('Get all invoices error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch invoices'
        });
    }
};

// ==================== GET SINGLE INVOICE BY ID ====================
exports.getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const invoice = await ManualInvoice.findById(id);
        
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: invoice,
            message: 'Invoice fetched successfully'
        });
        
    } catch (error) {
        console.error('Get invoice by ID error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch invoice'
        });
    }
};

// ==================== DELETE INVOICE ====================
exports.ManualdeleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        
        const invoice = await ManualInvoice.findById(id);
        
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }
        
        // Delete PDF file if exists
        if (invoice.pdfPath && fs.existsSync(invoice.pdfPath)) {
            try {
                fs.unlinkSync(invoice.pdfPath);
                console.log('PDF file deleted:', invoice.pdfPath);
            } catch (fileError) {
                console.error('Error deleting PDF file:', fileError);
            }
        }
        
        // Delete invoice from database
        await ManualInvoice.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: 'Invoice deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete invoice error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete invoice'
        });
    }
}; 

// ==================== GET MY MANUAL INVOICES (FOR CUSTOMER) ====================
exports.getMyManualInvoices = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const userEmail = req.user?.email?.toLowerCase().trim();
        const userId = req.user?._id || req.user?.id;
        
        console.log('🔍 Fetching manual invoices for customer:', { userId, userEmail });
        
        // Build filter for customer - case-insensitive email + customerId
        const emailRegex = userEmail
            ? new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
            : null;
        
        let filter = {
            $or: [
                ...(userId ? [{ customerId: userId }] : []),
                ...(emailRegex ? [{ 'customerInfo.email': emailRegex }] : [])
            ]
        };
        
        if (filter.$or.length === 0) {
            filter.$or = [{ customerId: null }];
        }
        
        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);
        
        // Get invoices
        const invoices = await ManualInvoice.find(filter)
            .populate('shipmentId', 'trackingNumber')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        
        // Get total count
        const total = await ManualInvoice.countDocuments(filter);
        
        // Calculate summary
        const summary = {
            total: total,
            paid: await ManualInvoice.countDocuments({ ...filter, status: 'paid' }),
            pending: await ManualInvoice.countDocuments({ ...filter, status: { $in: ['generated', 'sent'] } }),
            totalAmount: await ManualInvoice.aggregate([
                { $match: filter },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]).then(result => result[0]?.total || 0)
        };
        
        res.status(200).json({
            success: true,
            data: invoices,
            summary: summary,
            pagination: {
                total,
                page: parseInt(page),
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            },
            message: 'Your manual invoices fetched successfully'
        });
        
    } catch (error) {
        console.error('Get my manual invoices error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch your invoices'
        });
    }
};