const NewShipment = require('../models/newShipmentModel');
const Shipment = require('../models/shipmentModel');
const { sendEmail, getSenderEmailTemplate, getReceiverEmailTemplate, getAdminEmailTemplate } = require('../service/manualShipmentMail');
const { generateInvoiceFromShipment } = require('../utils/manualInvoiceGenerator');
const { sendManualShippingStatusEmail } = require('../utils/emailService');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const TRACK_NOTIFICATION_EMAIL = 'tracking@samuderathai.com';

const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  const value = email.trim().toLowerCase();
  return value || null;
};

const getAdminNotificationRecipients = async () => {
  const admins = await User.find({
    role: { $in: ['admin', 'super_admin'] },
    isActive: true
  }).select('email');

  const dbAdminEmails = admins.map((admin) => normalizeEmail(admin.email)).filter(Boolean);
  console.log('🔍 DB admin emails:', dbAdminEmails);

  return [...new Set(dbAdminEmails)];
};

// ================== HELPER FUNCTIONS ==================

// Generate shipment number
const generateShipmentNumber = async () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const count = await NewShipment.countDocuments({
        shipmentNumber: new RegExp(`^SHP-${year}${month}`)
    });

    return `SHP-${year}${month}-${(count + 1).toString().padStart(5, '0')}`;
};


// Generate tracking number (safe + unique)
const generateTrackingNumber = async () => {
    const prefix = 'CLG';
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '23456789';

    let trackingNumber;
    let exists = true;
    let attempts = 0;

    while (exists && attempts < 10) {
        trackingNumber = prefix;

        // 2 letters
        for (let i = 0; i < 2; i++) {
            trackingNumber += letters[Math.floor(Math.random() * letters.length)];
        }

        // 4 numbers
        for (let i = 0; i < 4; i++) {
            trackingNumber += numbers[Math.floor(Math.random() * numbers.length)];
        }

        // 2 letters
        for (let i = 0; i < 2; i++) {
            trackingNumber += letters[Math.floor(Math.random() * letters.length)];
        }

        const existing = await NewShipment.findOne({ trackingNumber });
        exists = !!existing;
        attempts++;
    }

    return trackingNumber || `CLG${Date.now().toString().slice(-8)}`;
};



// ================== CREATE SHIPMENT ================== 

// createShipment ফাংশনটি আপডেট করুন
exports.createShipment = async (req, res) => {
    try {
        const bookingData = req.body;
        console.log('📦 Creating shipment:', bookingData);

        // Generate tracking and shipment numbers
    const providedTrackingNumber = bookingData.trackingNumber?.trim().toUpperCase();
    const trackingNumber = providedTrackingNumber || await generateTrackingNumber();

    if (providedTrackingNumber) {
      const [existingNewShipment, existingShipment, existingBooking] = await Promise.all([
        NewShipment.findOne({ trackingNumber: providedTrackingNumber }),
        Shipment.findOne({ trackingNumber: providedTrackingNumber }),
        Booking.findOne({ trackingNumber: providedTrackingNumber })
      ]);

      if (existingNewShipment || existingShipment || existingBooking) {
        return res.status(400).json({
          success: false,
          message: `Tracking number ${providedTrackingNumber} already exists`
        });
      }
    }
        const shipmentNumber = bookingData.shipmentNumber || await generateShipmentNumber();

        // Calculate total packages and weight
        const packageDetails = (bookingData.shipmentDetails?.packageDetails || bookingData.packages || []);
        const totalPackages = packageDetails.reduce((sum, pkg) => sum + (pkg.quantity || 1), 0);
        const totalWeight = packageDetails.reduce((sum, pkg) => sum + (pkg.weight || 0), 0);

        // Timeline entries
        const timelineEntries = (bookingData.timeline || []).map(entry => ({
            status: entry.status,
            description: entry.description || '',
            location: entry.location || '',
            updatedBy: entry.updatedBy || bookingData.createdBy,
            timestamp: entry.timestamp || new Date(),
            metadata: entry.metadata || {}
        }));

        if (timelineEntries.length === 0) {
            timelineEntries.push({
                status: bookingData.status || 'booking_requested',
                description: 'Shipment created',
                location: bookingData.shipmentDetails?.origin || '',
                updatedBy: bookingData.createdBy,
                timestamp: new Date()
            });
        }

        // Create shipment
        const shipment = await NewShipment.create({
            shipmentNumber,
            trackingNumber,
            bookingId: null,
            customerId: bookingData.customer || null,
            customerInfo: {
                name: bookingData.sender?.name,
                email: bookingData.sender?.email,
                phone: bookingData.sender?.phone,
                companyName: bookingData.sender?.companyName
            },
            shipmentClassification: bookingData.shipmentClassification,
            serviceType: bookingData.serviceType || 'standard',
            shipmentDetails: {
                origin: bookingData.shipmentDetails?.origin,
                destination: bookingData.shipmentDetails?.destination,
                shippingMode: bookingData.shipmentDetails?.shippingMode || 'DDU',
                totalPackages: totalPackages,
                totalWeight: totalWeight,
                packageDetails: packageDetails.map(pkg => ({
                    description: pkg.description,
                    packagingType: pkg.packagingType || 'carton',
                    quantity: pkg.quantity || 1,
                    weight: pkg.weight || 0,
                    volume: pkg.volume || 0,
                    dimensions: pkg.dimensions || {},
                    productCategory: pkg.productCategory || 'Others',
                    hsCode: pkg.hsCode || '',
                    value: pkg.value || { amount: 0, currency: 'USD' },
                    hazardous: pkg.hazardous || false,
                    temperatureControlled: pkg.temperatureControlled || { required: false }
                })),
                specialInstructions: bookingData.shipmentDetails?.specialInstructions || '',
                referenceNumber: bookingData.shipmentDetails?.referenceNumber || ''
            },
              containers: Array.isArray(bookingData.containers)
                ? bookingData.containers
                  .map((container) => ({
                    containerNumber: container?.containerNumber || '',
                    sealNumber: container?.sealNumber || '',
                    blNumber: container?.blNumber || container?.BLNumber || container?.bl_number || ''
                  }))
                  .filter((container) => container.containerNumber || container.sealNumber || container.blNumber)
                : (Array.isArray(bookingData.shipmentDetails?.containers)
                  ? bookingData.shipmentDetails.containers
                    .map((container) => ({
                      containerNumber: container?.containerNumber || '',
                      sealNumber: container?.sealNumber || '',
                      blNumber: container?.blNumber || container?.BLNumber || container?.bl_number || ''
                    }))
                    .filter((container) => container.containerNumber || container.sealNumber || container.blNumber)
                  : []),
            transport: {
                vesselName: bookingData.transport?.vesselName || bookingData.shipmentDetails?.vesselName || bookingData.vesselName || '',
                voyageNumber: bookingData.transport?.voyageNumber || bookingData.shipmentDetails?.voyageNumber || bookingData.voyageNumber || '',
                flightNumber: bookingData.transport?.flightNumber || bookingData.shipmentDetails?.flightNumber || '',
                carrierName: bookingData.transport?.carrierName || bookingData.courier?.company || 'Samudera Traffic Co., Ltd. Group'
            },
            dates: {
                estimatedDeparture: bookingData.dates?.estimatedDeparture,
                estimatedArrival: bookingData.dates?.estimatedArrival
            },
            quotedPrice: {
                amount: bookingData.quotedPrice?.amount || 0,
                currency: bookingData.quotedPrice?.currency || 'USD',
                breakdown: bookingData.quotedPrice?.breakdown || {},
                notes: bookingData.quotedPrice?.notes || '',
                quotedBy: bookingData.createdBy,
                quotedAt: new Date()
            },
            pricingStatus: bookingData.pricingStatus || 'quoted',
            payment: {
                mode: bookingData.payment?.mode || 'bank_transfer',
                currency: bookingData.payment?.currency || 'USD',
                amount: bookingData.quotedPrice?.amount || 0,
                status: 'pending'
            },
            sender: bookingData.sender,
            receiver: bookingData.receiver,
            courier: {
                company: bookingData.courier?.company || 'Samudera Traffic Co., Ltd. Group',
                serviceType: bookingData.serviceType
            },
            status: bookingData.status || 'booking_requested',
            initialShipmentStatus: bookingData.initialShipmentStatus || bookingData.shipmentStatus || bookingData.status || 'pending',
            shipmentStatus: bookingData.shipmentStatus || 'pending',
            currentMilestone: timelineEntries[timelineEntries.length - 1]?.status,
            timeline: timelineEntries,
            createdBy: bookingData.createdBy,
            updatedBy: bookingData.createdBy
        });

        console.log('✅ Shipment created:', shipment._id);

        // Send emails in background
        sendEmailsInBackground(shipment).catch(err => {
            console.error('❌ Background email error:', err);
        });

        // Return response without invoice for manual booking creation
        return res.status(201).json({
            success: true,
          message: 'Shipment created successfully',
            data: {
            shipment
            }
        });

    } catch (error) {
        console.error('❌ ERROR:', error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Duplicate tracking or shipment number',
                error: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to create shipment',
            error: error.message
        });
    }
};

// ==================== GET SHIPMENT WITH INVOICE ====================
exports.getShipmentWithInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        
        const shipment = await NewShipment.findById(id);
        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: 'Shipment not found'
            });
        }

        const invoice = await Invoice.findOne({ shipmentId: shipment._id });

        return res.status(200).json({
            success: true,
            data: {
                shipment,
                invoice: invoice || null
            }
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch shipment',
            error: error.message
        });
    }
};

// ==================== REGENERATE INVOICE ====================
exports.regenerateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        
        const shipment = await NewShipment.findById(id);
        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: 'Shipment not found'
            });
        }

        // Delete old invoice if exists
        await Invoice.deleteOne({ shipmentId: shipment._id });

        // Generate new invoice
        const invoice = await generateInvoiceFromShipment(shipment);

        // Update shipment with new invoice reference
        await NewShipment.findByIdAndUpdate(shipment._id, {
            $set: { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber }
        });

        return res.status(200).json({
            success: true,
            message: 'Invoice regenerated successfully',
            data: invoice
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to regenerate invoice',
            error: error.message
        });
    }
};

// এই ফাংশনটি createShipment এর বাইরে যোগ করুন (একদম নিচে)
async function sendEmailsInBackground(shipment) {
    console.log('📧 Starting background emails for:', shipment._id);
    
    try {
  const attachments = [];

    // 1. Customer email entered by admin during manual booking
    const customerEmail = normalizeEmail(shipment.sender?.email || shipment.customerInfo?.email);
    if (customerEmail) {
            const customerSent = await sendEmail(
                customerEmail,
                `Shipment Created - ${shipment.shipmentNumber}`,
        getSenderEmailTemplate(shipment),
        attachments
            );
            if (customerSent) {
              console.log(`✅ Email to customer: ${customerEmail}`);
            } else {
              console.error(`❌ Customer email failed: ${customerEmail}`);
            }
        }

        // 2. Receiver কে ইমেইল - normalize and log address for diagnostics
        const receiverEmail = normalizeEmail(shipment.receiver?.email);
        console.log('📧 Prepared receiver email:', receiverEmail);
        if (receiverEmail) {
            const receiverSent = await sendEmail(
                receiverEmail,
                `Your Parcel is On The Way - ${shipment.shipmentNumber}`,
                getReceiverEmailTemplate(shipment),
                attachments
            );
            if (receiverSent) {
              console.log(`✅ Email to receiver: ${receiverEmail}`);
            } else {
              console.error(`❌ Receiver email failed: ${receiverEmail}`);
            }
        } else {
          console.warn('⚠️ Receiver email missing or invalid, skipping receiver notification');
        }

        const trackEmail = normalizeEmail(TRACK_NOTIFICATION_EMAIL);
        if (trackEmail) {
          const trackSent = await sendEmail(
            trackEmail,
            `New Shipment Created - ${shipment.shipmentNumber}`,
            getAdminEmailTemplate(shipment),
            attachments
          );

          if (trackSent) {
            console.log(`✅ Tracking mailbox notification sent: ${trackEmail}`);
          } else {
            console.error(`❌ Tracking mailbox notification failed: ${trackEmail}`);
          }
        }

        // 3. All admins + track mailbox
        const adminEmails = await getAdminNotificationRecipients();
        const additionalAdminEmails = [
          normalizeEmail(process.env.ADMIN_DEFAULT_EMAIL),
          normalizeEmail(process.env.SMTP_USER),
          normalizeEmail(process.env.SMTP_USER_INFO),
          normalizeEmail(process.env.EMAIL_FROM_INFO)
        ].filter(Boolean);

        const allRecipients = [...new Set([...(adminEmails || []), ...additionalAdminEmails])]
          .filter((recipient) => recipient !== trackEmail);
        console.log('📧 Manual booking admin recipients:', allRecipients);

        if (allRecipients.length > 0) {
          let adminSuccessCount = 0;
          for (const recipient of allRecipients) {
            const sent = await sendEmail(
              recipient,
              `New Shipment Created - ${shipment.shipmentNumber}`,
              getAdminEmailTemplate(shipment),
              attachments
            );

            if (sent) {
              adminSuccessCount += 1;
              console.log(`✅ Admin notification sent to: ${recipient}`);
            } else {
              console.error(`❌ Admin notification failed for: ${recipient}`);
            }
          }

          console.log(`📊 Admin notifications sent: ${adminSuccessCount}/${allRecipients.length}`);
        } else {
          console.warn('⚠️ No admin recipients found for manual booking notification');
        }

        console.log('✅ All emails processed for:', shipment._id);
    } catch (error) {
        console.error('❌ Background email failed:', error);
    }
}
// GET ALL SHIPMENTS - বুকিং কন্ট্রোলারের মতো করে
exports.getAllNewShipments = async (req, res) => {
  try {
    console.log('📥 getAllShipments called with query:', req.query);
    
    const { page = 1, limit = 20, status, mode, search } = req.query;
    
    // Build filter - বুকিংয়ের মতো
    let filter = {};
    if (status) filter.status = status;
    if (mode) filter['shipmentDetails.shipmentType'] = mode;
    
    if (search) {
      filter.$or = [
        { shipmentNumber: new RegExp(search, 'i') },
        { trackingNumber: new RegExp(search, 'i') }
      ];
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Get shipments with population - বুকিংয়ের মতো
    const shipments = await NewShipment.find(filter)
      .populate('customerId', 'firstName lastName email companyName phone') 
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    // Get total count
    const total = await NewShipment.countDocuments(filter);
    
    // Calculate summary stats - বুকিংয়ের মতো
    const summary = {
      total: shipments.length,
      active: shipments.filter(s => !['delivered', 'cancelled'].includes(s.status)).length,
      delivered: shipments.filter(s => s.status === 'delivered').length,
      cancelled: shipments.filter(s => s.status === 'cancelled').length,
      pending: shipments.filter(s => s.status === 'pending').length,
      inTransit: shipments.filter(s => s.status === 'in_transit').length
    };
    
    // Response format - বুকিংয়ের মতো
    res.status(200).json({
      success: true,
      data: shipments,
      summary: summary,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      },
      message: 'Shipments fetched successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in getAllShipments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 
 
exports.updateShipmentTrackingNumber = async (req, res) => {
    try {
        const { id } = req.params;
        const { trackingNumber } = req.body;

        if (!trackingNumber) {
            return res.status(400).json({
                success: false,
                message: 'Tracking number is required'
            });
        }

        const normalizedTrackingNumber = trackingNumber.trim().toUpperCase();
        const [existingNewShipment, existingShipment, existingBooking] = await Promise.all([
          NewShipment.findOne({ trackingNumber: normalizedTrackingNumber, _id: { $ne: id } }),
          Shipment.findOne({ trackingNumber: normalizedTrackingNumber }),
          Booking.findOne({ trackingNumber: normalizedTrackingNumber })
        ]);

        if (existingNewShipment || existingShipment || existingBooking) {
          return res.status(400).json({
            success: false,
            message: `Tracking number ${normalizedTrackingNumber} already exists`
          });
        }

        console.log('📦 Updating tracking number for shipment:', id);
        console.log('🔢 New tracking number:', normalizedTrackingNumber);

        // 1️⃣ Shipment আপডেট করুন
        const shipment = await NewShipment.findByIdAndUpdate(
            id,
            { 
            trackingNumber: normalizedTrackingNumber,
                updatedBy: req.user?._id 
            },
            { new: true }
        );

        if (!shipment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Shipment not found' 
            });
        }

        console.log('✅ Shipment updated:', shipment.shipmentNumber);

        // 2️⃣ 🔴 Booking-ও আপডেট করুন (এটাই missing ছিল)
        let bookingUpdated = false;
        
        // উপায় 1: shipment.bookingId দিয়ে
        if (shipment.bookingId) {
            const booking = await Booking.findByIdAndUpdate(
                shipment.bookingId,
                { 
                  trackingNumber: normalizedTrackingNumber,
                  'shipmentDetails.trackingNumber': normalizedTrackingNumber 
                },
                { new: true }
            );
            if (booking) {
                bookingUpdated = true;
                console.log('✅ Booking updated via bookingId:', booking.bookingNumber);
            }
        }
        
        // উপায় 2: bookingNumber দিয়ে (যদি উপায় 1 কাজ না করে)
        if (!bookingUpdated && shipment.bookingNumber) {
            const booking = await Booking.findOneAndUpdate(
                { bookingNumber: shipment.bookingNumber },
                { 
                  trackingNumber: normalizedTrackingNumber,
                  'shipmentDetails.trackingNumber': normalizedTrackingNumber 
                },
                { new: true }
            );
            if (booking) {
                bookingUpdated = true;
                console.log('✅ Booking updated via bookingNumber:', booking.bookingNumber);
            }
        }
        
        // উপায় 3: shipmentNumber দিয়ে (যদি উপায় 1-2 কাজ না করে)
        if (!bookingUpdated && shipment.shipmentNumber) {
            const booking = await Booking.findOneAndUpdate(
                { 'shipmentDetails.shipmentNumber': shipment.shipmentNumber },
                { 
                  trackingNumber: normalizedTrackingNumber,
                  'shipmentDetails.trackingNumber': normalizedTrackingNumber 
                },
                { new: true }
            );
            if (booking) {
                bookingUpdated = true;
                console.log('✅ Booking updated via shipmentNumber:', booking.bookingNumber);
            }
        }

        if (!bookingUpdated) {
            console.log('⚠️ Warning: No booking found to update tracking number');
        }

        res.status(200).json({
            success: true,
            message: '✅ Tracking number updated successfully in both Shipment and Booking',
            data: {
                shipment: shipment,
                bookingUpdated: bookingUpdated
            }
        });

    } catch (error) {
        console.error('❌ Update tracking error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
// controllers/newShipmentController.js - getMyShipments ফাংশন

exports.getMyShipments = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search, status, startDate, endDate } = req.query;

    console.log('🔍 getMyShipments called with query:', req.query);
    console.log('🔍 User ID:', req.user?._id);
    console.log('🔍 User email:', req.user?.email);

    // Build query - search by multiple conditions
    const userEmail = req.user.email?.toLowerCase().trim() || '';
    const emailRegex = userEmail
      ? new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      : null;

    let query = {
      $or: [
        { customerId: req.user._id },
        ...(emailRegex ? [
          { 'sender.email': emailRegex },
          { 'receiver.email': emailRegex },
          { 'customerInfo.email': emailRegex }
        ] : [])
      ]
    };

    // Add search filter
    if (search) {
      query.$and = [
        {
          $or: [
            { shipmentNumber: { $regex: search, $options: 'i' } },
            { trackingNumber: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    // Add status filter
    if (status && status !== 'all') {
      query.shipmentStatus = status;
    }

    // Add date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    console.log('🔍 MongoDB Query:', JSON.stringify(query, null, 2));
    
    // Count total documents
    const total = await NewShipment.countDocuments(query);
    console.log('📊 Total count:', total);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const shipments = await NewShipment.find(query)
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('customerId', 'firstName lastName email phone companyName');
    
    console.log(`✅ Found ${shipments.length} shipments for user: ${req.user.email}`);
    
    // Calculate summary
    const summary = await getShipmentSummaryForCustomer(req.user._id);
    
    // Return response
    res.status(200).json({
      success: true,
      data: shipments,
      summary: summary,
      pagination: {
        total: total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      message: 'Shipments fetched successfully'
    });
    
  } catch (error) {
    console.error('❌ Get my shipments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipments',
      error: error.message
    });
  }
};

// @desc    Get single shipment by ID for customer
// @route   GET /api/v1/shipments/my-shipments/:id
// @access  Private/Customer
exports.getMyShipmentById = async (req, res) => {
  try {
    const shipment = await NewShipment.findOne({
      _id: req.params.id,
      customerId: req.user._id
    }).populate('customerId', 'firstName lastName email phone companyName');
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: shipment,
      message: 'Shipment fetched successfully'
    });
  } catch (error) {
    console.error('Get my shipment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipment',
      error: error.message
    });
  }
};

// @desc    Get shipment tracking info for customer
// @route   GET /api/v1/shipments/my-shipments/:id/tracking
// @access  Private/Customer
exports.getMyShipmentTracking = async (req, res) => {
  try {
    const shipment = await NewShipment.findOne({
      _id: req.params.id,
      customerId: req.user._id
    });
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }
    
    const trackingInfo = {
      trackingNumber: shipment.trackingNumber,
      status: shipment.shipmentStatus,
      currentLocation: shipment.currentLocation,
      estimatedDelivery: shipment.dates?.estimatedArrival,
      timeline: shipment.timeline || [],
      progress: getShipmentProgress(shipment.shipmentStatus)
    };
    
    res.status(200).json({
      success: true,
      data: trackingInfo,
      message: 'Tracking info fetched successfully'
    });
  } catch (error) {
    console.error('Get tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tracking info',
      error: error.message
    });
  }
};

// @desc    Get shipment summary for customer
// @route   GET /api/v1/shipments/my-shipments/summary
// @access  Private/Customer
exports.getMyShipmentSummary = async (req, res) => {
  try {
    const summary = await getShipmentSummaryForCustomer(req.user._id);
    
    res.status(200).json({
      success: true,
      data: summary,
      message: 'Summary fetched successfully'
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch summary',
      error: error.message
    });
  }
};

// Helper function to get shipment summary for a customer
async function getShipmentSummaryForCustomer(customerId) {
  const stats = await NewShipment.aggregate([
    { $match: { customerId: customerId } },
    {
      $group: {
        _id: '$shipmentStatus',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const summary = {
    total: 0,
    active: 0,
    delivered: 0,
    cancelled: 0,
    pending: 0,
    inTransit: 0,
    processing: 0
  };
  
  stats.forEach(stat => {
    summary.total += stat.count;
    
    switch (stat._id) {
      case 'delivered':
      case 'completed':
        summary.delivered += stat.count;
        break;
      case 'cancelled':
      case 'returned':
        summary.cancelled += stat.count;
        break;
      case 'pending':
      case 'booking_requested':
        summary.pending += stat.count;
        break;
      case 'in_transit':
      case 'departed_port_of_origin':
      case 'arrived_at_destination_port':
        summary.inTransit += stat.count;
        break;
      default:
        summary.active += stat.count;
        summary.processing += stat.count;
    }
  });
  
  summary.active = summary.total - (summary.delivered + summary.cancelled);
  
  return summary;
}

function getShipmentProgress(status) {
  const progressMap = {
    'booking_requested': 5,
    'pending': 10,
    'received_at_warehouse': 20,
    'picked_up_from_warehouse': 30,
    'departed_port_of_origin': 50,
    'in_transit': 60,
    'arrived_at_destination_port': 70,
    'customs_clearance': 80,
    'out_for_delivery': 90,
    'delivered': 100,
    'completed': 100,
    'cancelled': 0
  };
  return progressMap[status] || 0;
} 

// Define status sequence
const STATUS_SEQUENCE = [
  'booking_requested',
  'pending',
  'received_at_warehouse',
  'picked_up_from_warehouse',
  'loaded_in_container',
  'container_sealed',
  'departed_port_of_origin',
  'in_transit',
  'arrived_at_destination_port',
  'under_customs_cleared',
  'customs_clearance',
  'unloaded_from_vessel',
  'out_for_delivery',
  'delivered'
];

// Helper function to validate status transition
const isValidStatusTransition = (currentStatus, newStatus) => {
  const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus);
  const newIndex = STATUS_SEQUENCE.indexOf(newStatus);
  
  if (currentIndex === -1) {
    return newStatus === 'cancelled';
  }
  
  if (newIndex > currentIndex) {
    return true;
  }
  
  if (newStatus === 'cancelled' && currentStatus !== 'delivered') {
    return true;
  }
  
  return false;
};

// Update shipment status
// In newShipmentController.js

exports.updateShipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, resumeTo, updateDateTime, containers, transport, transports, vesselName, voyageNumber, bookingNumber } = req.body;
    const userId = req.user?._id || req.user?.id || 'system';

    const STATUS_ALIASES = {
      in_transit_sea_freight: 'in_transit',
      loaded_into_container: 'loaded_in_container',
      customs_cleared: 'customs_clearance'
    };
    const normalizeStatus = (value) => STATUS_ALIASES[value] || value;

    const hasContainerUpdate = Array.isArray(containers) && containers.length > 0;
    const hasBookingNumberUpdate = typeof bookingNumber === 'string' && bookingNumber.trim() !== '';
    const hasTransportUpdate = Boolean(transport || vesselName || voyageNumber);

    // Allow updates when status is omitted if containers, transport, or bookingNumber are provided.
    if (!status && !hasContainerUpdate && !hasTransportUpdate && !hasBookingNumberUpdate) {
      return res.status(400).json({
        success: false,
        message: 'Status is required unless updating shipment containers, transport details, or booking number'
      });
    }

    // Define status sequence
    const STATUS_SEQUENCE = [
      'booking_requested',
      'pending',
      'received_at_warehouse',
      'picked_up_from_warehouse',
      'loaded_in_container',
      'container_sealed',
      'departed_port_of_origin',
      'in_transit',
      'arrived_at_destination_port',
      'under_customs_cleared',
      'customs_clearance',
      'unloaded_from_vessel',
      'out_for_delivery',
      'delivered',
      'completed'
    ];

    // Validation function - UPDATED to allow on_hold
    const isValidStatusTransition = (currentStatus, newStatus) => {
      // Cancelled is terminal.
      if (currentStatus === 'cancelled') {
        return false;
      }

      // While on hold, shipment can resume to an active status or be cancelled.
      if (currentStatus === 'on_hold') {
        return newStatus !== 'on_hold';
      }

      // Allow on_hold from any non-cancelled status
      if (newStatus === 'on_hold') {
        return true;
      }
      
      // Allow cancelled from any non-cancelled status
      if (newStatus === 'cancelled') {
        return true;
      }
      
      const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus);
      const newIndex = STATUS_SEQUENCE.indexOf(newStatus);
      
      // Normal forward progression
      if (currentIndex !== -1 && newIndex > currentIndex) {
        return true;
      }
      
      return false;
    };

    // Function to get allowed next statuses - UPDATED
    const getAllowedNextStatuses = (currentStatus) => {
      const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus);
      
      if (currentStatus === 'cancelled') {
        return [];
      }

      if (currentStatus === 'on_hold') {
        return ['cancelled'];
      }
      
      const nextStatuses = [];
      
      // Add on_hold for any non-delivered status
      if (currentStatus !== 'on_hold') {
        nextStatuses.push('on_hold');
      }
      
      // Add cancelled for any non-delivered status
      nextStatuses.push('cancelled');
      
      // Add forward progression statuses
      if (currentIndex !== -1) {
        const forwardStatuses = STATUS_SEQUENCE.slice(currentIndex + 1);
        nextStatuses.push(...forwardStatuses);
      }
      
      return nextStatuses;
    };

    // Find the shipment
    const existingShipment = await NewShipment.findById(id);
    
    if (!existingShipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    const currentStatusRaw = existingShipment.shipmentStatus || existingShipment.status;
    const currentStatus = normalizeStatus(currentStatusRaw);
    const requestedStatus = normalizeStatus(status || currentStatus);
    const requestedResumeTo = normalizeStatus(resumeTo);
    const normalizedContainers = Array.isArray(containers)
      ? containers
          .map((container) => ({
            containerNumber: container?.containerNumber || '',
            sealNumber: container?.sealNumber || '',
            blNumber: container?.blNumber || container?.BLNumber || container?.bl_number || ''
          }))
          .filter((container) => container.containerNumber || container.sealNumber || container.blNumber)
      : null;

    // Allow shipment-level container updates even when the status does not change.
    if (currentStatus === requestedStatus && !normalizedContainers) {
      return res.status(200).json({
        success: true,
        data: existingShipment,
        message: `Shipment already in ${requestedStatus} status`
      });
    }

    if (currentStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cancelled shipment cannot be resumed or updated'
      });
    }

    // Handle on_hold special case
    let finalStatus = requestedStatus;

    if (currentStatus === 'on_hold' && requestedStatus !== 'cancelled') {
      // Resuming from on_hold
      const expectedResume = normalizeStatus(existingShipment.lastActiveStatus);
      const resumeTarget = requestedResumeTo || requestedStatus;

      if (expectedResume && resumeTarget !== expectedResume) {
        return res.status(400).json({
          success: false,
          message: `Invalid resume target. Shipment can only resume to ${expectedResume}`,
          expectedResume,
          requestedResume: resumeTarget
        });
      }

      finalStatus = expectedResume || resumeTarget;
    } else if (requestedStatus === 'on_hold') {
      // Going into on_hold
      finalStatus = 'on_hold';
    }

    // Validate status transition unless the request is a container-only update
    // Allow saving containers when finalStatus === currentStatus (no transition)
    let isValid = true;
    if (finalStatus !== currentStatus) {
      isValid = isValidStatusTransition(currentStatus, finalStatus);
    }

    if (!isValid) {
      const allowedStatuses = getAllowedNextStatuses(currentStatus);

      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${currentStatus} to ${finalStatus}. You can only move forward in sequence, put on hold, or cancel.`,
        currentStatus,
        requestedStatus: finalStatus,
        allowedNextStatuses: allowedStatuses
      });
    }

    // Get current timestamp
    const now = updateDateTime ? new Date(updateDateTime) : new Date();

    // Prepare update data
    const updateData = {
      shipmentStatus: finalStatus,
      status: finalStatus,
      lastStatusUpdate: now,
      lastUpdatedBy: userId
    };

    if (normalizedContainers) {
      updateData.containers = normalizedContainers;
    }

    if (hasBookingNumberUpdate) {
      updateData.bookingNumber = bookingNumber.trim();
    }

    if (hasTransportUpdate) {
      // Support both single transport object and array of transports (transportLegs)
      if (Array.isArray(transports) && transports.length > 0) {
        const normalizedLegs = transports
          .map((leg) => ({
            vesselName: leg?.vesselName || '',
            voyageNumber: leg?.voyageNumber || ''
          }))
          .filter((leg) => leg.vesselName || leg.voyageNumber);
        
        if (normalizedLegs.length > 0) {
          updateData.transportLegs = normalizedLegs;
          // Also set the last leg as primary transport
          updateData.transport = {
            ...existingShipment.transport?.toObject?.(),
            ...normalizedLegs[normalizedLegs.length - 1]
          };
        }
      } else if (transport || vesselName || voyageNumber) {
        updateData.transport = {
          ...existingShipment.transport?.toObject?.(),
          ...(transport || {}),
          ...(vesselName ? { vesselName } : {}),
          ...(voyageNumber ? { voyageNumber } : {})
        };
      }
    }

    // Handle lastActiveStatus for on_hold
    if (requestedStatus === 'on_hold') {
      updateData.lastActiveStatus = currentStatus;
    } else if (currentStatus === 'on_hold' && finalStatus !== 'cancelled') {
      updateData.lastActiveStatus = null;
    } else if (finalStatus === 'cancelled' && currentStatus !== 'on_hold') {
      updateData.lastActiveStatus = currentStatus;
    }

    const shouldAddTimelineEntry = finalStatus !== currentStatus || Boolean(normalizedContainers);

    const timelineEntry = shouldAddTimelineEntry ? {
      status: finalStatus,
      description: notes || (normalizedContainers ? 'Updated container/seal information' : `Status updated from ${currentStatus} to ${finalStatus}`),
      timestamp: now,
      updatedBy: userId,
      containers: normalizedContainers || undefined
    } : null;

    const updatePayload = { $set: updateData };

    if (timelineEntry) {
      updatePayload.$push = { timeline: timelineEntry };
    }

    // Update the shipment
    const updatedShipment = await NewShipment.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true, runValidators: true }
    );

    // Send status update emails in background (don't block response)
    if (finalStatus !== currentStatus) {
      setImmediate(async () => {
        try {
          await sendManualShippingStatusEmail({
            shipmentNumber: updatedShipment.shipmentNumber,
            trackingNumber: updatedShipment.trackingNumber,
            status: finalStatus,
            location: notes || `Status updated to ${finalStatus.replace(/_/g, ' ')}`,
            timestamp: now,
            description: notes || `Shipment status has been updated to ${finalStatus.replace(/_/g, ' ')}`,
            senderName: updatedShipment.sender?.name || 'Sender',
            senderEmail: updatedShipment.sender?.email,
            receiverName: updatedShipment.receiver?.name || 'Receiver',
            receiverEmail: updatedShipment.receiver?.email,
            origin: updatedShipment.shipmentDetails?.origin,
            destination: updatedShipment.shipmentDetails?.destination,
            estimatedDelivery: updatedShipment.dates?.estimatedArrival
          });
        } catch (emailError) {
          console.error('Failed to send status update emails:', emailError);
          // Don't throw - we don't want to fail the status update if email fails
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedShipment,
      message: `Shipment status updated from ${currentStatus} to ${finalStatus} successfully`
    });

  } catch (error) {
    console.error('Error updating shipment status:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update shipment status'
    });
  }
};

// ==================== UPDATE SENDER/RECEIVER INFO ====================
/**
 * Update sender and receiver information and sync with associated user
 */
exports.updateSenderReceiverInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { sender, receiver } = req.body;

    if (!sender && !receiver) {
      return res.status(400).json({
        success: false,
        message: 'At least one of sender or receiver information must be provided'
      });
    }

    // Find the shipment
    const shipment = await NewShipment.findById(id);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Update sender information
    if (sender) {
      // capture original sender email/customerId before overwriting
      const originalSenderEmail = shipment.sender?.email;
      const originalCustomerId = shipment.customerId;

      shipment.sender = {
        ...shipment.sender,
        ...sender
      };

      // Try to find the associated user: prefer customerId, then original email, then new sender.email
      try {
        let existingUser = null;

        if (originalCustomerId) {
          existingUser = await User.findById(originalCustomerId);
        }

        if (!existingUser && originalSenderEmail) {
          existingUser = await User.findOne({ email: originalSenderEmail.toLowerCase().trim() });
        }

        if (!existingUser && sender.email) {
          existingUser = await User.findOne({ email: sender.email.toLowerCase().trim() });
        }

        if (existingUser && existingUser.createdBy) {
          const updateData = {};
          if (sender.name) updateData.firstName = sender.name.split(' ')[0];
          if (sender.name) updateData.lastName = sender.name.split(' ').slice(1).join(' ');
          if (sender.phone) updateData.phone = sender.phone;
          if (sender.companyName) updateData.companyName = sender.companyName;
          if (sender.address) updateData.address = sender.address;

          // Handle email change safely: don't overwrite if email already belongs to another user
          if (sender.email && sender.email.toLowerCase().trim() !== existingUser.email) {
            const conflict = await User.findOne({ email: sender.email.toLowerCase().trim(), _id: { $ne: existingUser._id } });
            if (conflict) {
              console.warn(`⚠️ Email change for sender (${sender.email}) conflicts with another user. Skipping email update.`);
            } else {
              updateData.email = sender.email.toLowerCase().trim();
            }
          }

          if (Object.keys(updateData).length > 0) {
            await User.findByIdAndUpdate(existingUser._id, { $set: updateData });
            console.log(`✅ Updated user info for sender (userId: ${existingUser._id})`);
          }
        } else if (existingUser) {
          console.log(`ℹ️ Found user for sender but not manually-created (userId: ${existingUser._id}). Skipping update.`);
        } else {
          console.log(`ℹ️ No associated user found for sender (emails checked: ${[originalSenderEmail, sender.email].filter(Boolean).join(', ')})`);
        }
      } catch (userError) {
        console.warn('⚠️ Could not update sender user info:', userError.message);
        // Don't fail the shipment update if user update fails
      }
    }

    // Update receiver information
    if (receiver) {
      shipment.receiver = {
        ...shipment.receiver,
        ...receiver
      };

      // Try to update associated user for receiver similarly
      try {
        const originalReceiverEmail = shipment.receiver?.email;
        let existingUser = null;

        // No dedicated receiver customerId on model; check by original email first
        if (originalReceiverEmail) {
          existingUser = await User.findOne({ email: originalReceiverEmail.toLowerCase().trim() });
        }

        if (!existingUser && receiver.email) {
          existingUser = await User.findOne({ email: receiver.email.toLowerCase().trim() });
        }

        if (existingUser && existingUser.createdBy) {
          const updateData = {};
          if (receiver.name) updateData.firstName = receiver.name.split(' ')[0];
          if (receiver.name) updateData.lastName = receiver.name.split(' ').slice(1).join(' ');
          if (receiver.phone) updateData.phone = receiver.phone;
          if (receiver.companyName) updateData.companyName = receiver.companyName;
          if (receiver.address) updateData.address = receiver.address;

          if (receiver.email && receiver.email.toLowerCase().trim() !== existingUser.email) {
            const conflict = await User.findOne({ email: receiver.email.toLowerCase().trim(), _id: { $ne: existingUser._id } });
            if (conflict) {
              console.warn(`⚠️ Email change for receiver (${receiver.email}) conflicts with another user. Skipping email update.`);
            } else {
              updateData.email = receiver.email.toLowerCase().trim();
            }
          }

          if (Object.keys(updateData).length > 0) {
            await User.findByIdAndUpdate(existingUser._id, { $set: updateData });
            console.log(`✅ Updated user info for receiver (userId: ${existingUser._id})`);
          }
        } else if (existingUser) {
          console.log(`ℹ️ Found user for receiver but not manually-created (userId: ${existingUser._id}). Skipping update.`);
        } else {
          console.log(`ℹ️ No associated user found for receiver (emails checked: ${[originalReceiverEmail, receiver.email].filter(Boolean).join(', ')})`);
        }
      } catch (userError) {
        console.warn('⚠️ Could not update receiver user info:', userError.message);
      }
    }

    // Save shipment changes
    await shipment.save();

    return res.status(200).json({
      success: true,
      message: 'Sender and receiver information updated successfully',
      data: shipment
    });

  } catch (error) {
    console.error('Error updating sender/receiver info:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update sender/receiver information'
    });
  }
};