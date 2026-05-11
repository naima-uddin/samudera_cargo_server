const mongoose = require('mongoose');

const consolidationSchema = new mongoose.Schema({
    consolidationNumber: {
        type: String,
        required: true,
        unique: true
    },
    receiptIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WarehouseReceipt'
    }],
    // ===== Classification (গ্রুপিং এর জন্য) =====
    mainType: {
        type: String,
        enum: ['sea_freight', 'air_freight', 'inland_trucking', 'multimodal'],
        required: true
    },
    subType: {
        type: String,
        enum: [
            'sea_freight_fcl', 'sea_freight_lcl', 'air_freight',
            'rail_freight', 'express_delivery', 'inland_transport', 'door_to_door'
        ],
        required: true
    },
    
    // Shipments in this consolidation
    shipments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment',
        required: true
    }],
    
    // Container Information
    containerNumber: {
        type: String,
        required: true
    },
    containerNumbers: [String],
    containerType: {
        type: String,
        enum: ['20ft', '40ft', '40ft HC', '45ft', 'LCL'],
        default: '20ft'
    },
    sealNumber: String,
    sealNumbers: [String],
    vesselName: String,
    voyageNumber: String,
    blNumber: String,
    blNumbers: [String],
    
    // Route Information
    originWarehouse: {
        type: String,
        required: true
    },
    destinationPort: {
        type: String,
        required: true
    },
    destinationCountry: String,
    
    // Dates
    consolidationStarted: {
        type: Date,
        default: Date.now
    },
    consolidationCompleted: Date,
    estimatedDeparture: Date,
    actualDeparture: Date,
    estimatedArrival: Date,
    
    // Shipment Details
    totalShipments: {
        type: Number,
        default: 0
    },
    totalPackages: {
        type: Number,
        default: 0
    },
    totalWeight: {
        type: Number,
        default: 0
    },
    totalVolume: {
        type: Number,
        default: 0
    },

    // Hold / resume tracking
    lastActiveStatus: {
        type: String,
        enum: [
            'draft',
            'in_progress',
            'consolidated',
            'ready_for_dispatch',
            'pending',
            'received_at_warehouse',
            'picked_up_from_warehouse',
            'loaded',
            'loaded_into_container',
            'container_sealed',
            'dispatched',
            'departed',
            'departed_port_of_origin',
            'in_transit',
            'in_transit_sea_freight',
            'arrived',
            'arrived_at_destination_port',
            'under_customs_clearance',
            'under_customs_cleared',
            'customs_cleared',
            'unloaded_from_vessel',
            'out_for_delivery',
            'delivered',
            'completed',
            'on_hold',
            'cancelled',
            'returned'
        ]
    },
    
    // Items in consolidation
    items: [{
        shipmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shipment'
        },
        packageType: String,
        quantity: Number,
        description: String,
        weight: Number,
        volume: Number
    }],
    
    // ===== STATUS UPDATED WITH ALL VALUES =====
    status: {
        type: String,
        enum: [
            'draft',              // খসড়া
            'in_progress',        // কনসোলিডেশন চলছে
            'consolidated',       // কনসোলিডেশন সম্পন্ন
            'ready_for_dispatch', // ডিসপ্যাচের জন্য প্রস্তুত
            'pending',            // পেন্ডিং (বুকিং তৈরি হওয়ার পর)
            'received_at_warehouse', // গুদামে পাওয়া গেছে
            'picked_up_from_warehouse', // গুদাম থেকে পিক আপ করা হয়েছে
            'loaded',             // লোড করা হয়েছে
            'loaded_into_container', // কন্টেইনারে লোড করা হয়েছে
            'container_sealed',   // কন্টেইনার সিল করা হয়েছে
            'dispatched',         // ডিসপ্যাচ করা হয়েছে
            'departed',           // পোর্ট ছেড়েছে
            'departed_port_of_origin', // অরিজিন পোর্ট ছেড়েছে
            'in_transit',         // ট্রানজিটে
            'in_transit_sea_freight', // সমুদ্র পথে ট্রানজিটে
            'arrived', 
            'arrived_at_destination_port', // ডেস্টিনেশন পোর্টে পাওয়া গেছে
            'under_customs_clearance', // কাস্টমস ক্লিয়ারেন্সের অধীন
            'under_customs_cleared',           // পৌঁছেছে
            'customs_cleared',    // কাস্টমস ক্লিয়ারেন্স সম্পন্ন
            'unloaded_from_vessel', // জাহাজ থেকে আনলোড করা হয়েছে
            'out_for_delivery',   // ডেলিভারির জন্য বের হয়েছে
            'delivered',          // ডেলিভারি সম্পন্ন
            'on_hold',
            'cancelled',
            'completed',          // সম্পন্ন
            'returned'            // রিটার্ন করা হয়েছে
        ],
        default: 'draft'
    },
    
    // Tracking Timeline
    timeline: [{
        status: {
            type: String,
            enum: [
                'draft', 'in_progress', 'consolidated', 'ready_for_dispatch',
                'pending', 'received_at_warehouse', 'picked_up_from_warehouse',
                'loaded', 'loaded_into_container', 'container_sealed', 'dispatched', 
                'departed', 'departed_port_of_origin', 'in_transit', 'in_transit_sea_freight', 
                'arrived', 'arrived_at_destination_port', 'under_customs_clearance', 'under_customs_cleared',
                'customs_cleared', 'unloaded_from_vessel', 'out_for_delivery', 'delivered', 
                'completed', 'cancelled', 'on_hold', 'returned',
                'shipment_cancelled', 'shipment_on_hold', 'shipment_hold', 'shipment_damaged', 'shipment_returned', 'shipment_in_progress'
            ]
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        location: String,
        description: String,
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    
    // Documents
    documents: [{
        type: {
            type: String,
            enum: [
                'packing_list', 
                'container_manifest', 
                'bill_of_lading',
                'air_waybill',        // এয়ার ফ্রেইটের জন্য
                'customs_docs',
                'insurance_certificate'
            ]
        },
        url: String,
        uploadedAt: Date,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    
    // Carrier Information
    carrier: {
        name: String,
        bookingReference: String,
        vesselNumber: String,       // জাহাজের জন্য
        flightNumber: String,       // ফ্লাইটের জন্য
        vehicleNumber: String       // ট্রাকের জন্য
    },
    
    // Tracking
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for faster queries
consolidationSchema.index({ mainType: 1, subType: 1 });
consolidationSchema.index({ originWarehouse: 1, destinationPort: 1 });
consolidationSchema.index({ status: 1, createdAt: -1 });
consolidationSchema.index({ consolidationNumber: 1 });
consolidationSchema.index({ containerNumber: 1 });
consolidationSchema.index({ estimatedDeparture: 1, status: 1 });

// Generate consolidation number before saving
consolidationSchema.pre('save', async function(next) {
    if (this.isNew && !this.consolidationNumber) {
        const count = await this.constructor.countDocuments();
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        
        // টাইপ অনুযায়ী প্রিফিক্স
        let prefix = 'CN';
        if (this.mainType === 'sea_freight') prefix = 'SCN';
        if (this.mainType === 'air_freight') prefix = 'ACN';
        
        this.consolidationNumber = `${prefix}-${year}${month}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

// Virtual for total value
consolidationSchema.virtual('totalValue').get(function() {
    // যদি items এ value থাকে তাহলে যোগ করুন
    return 0; // আপনার লজিক অনুযায়ী
});

// Method to update status
consolidationSchema.methods.updateStatus = async function(newStatus, userId, location, description) {
    this.status = newStatus;
    this.updatedBy = userId;
    
    // Timeline এ যোগ করুন
    this.timeline.push({
        status: newStatus,
        timestamp: new Date(),
        location: location || this.currentLocation,
        description: description || `Status updated to ${newStatus}`,
        updatedBy: userId
    });
    
    // স্পেসিফিক স্ট্যাটাসের জন্য তারিখ আপডেট
    if (newStatus === 'consolidated') {
        this.consolidationCompleted = new Date();
    } else if (newStatus === 'dispatched' || newStatus === 'departed') {
        this.actualDeparture = new Date();
    } else if (newStatus === 'arrived') {
        this.estimatedArrival = new Date();
    } else if (newStatus === 'customs_cleared') {
        // কাস্টমস ক্লিয়ারেন্সের তারিখ রেকর্ড করুন
        this.customsClearedDate = new Date();
    } else if (newStatus === 'delivered') {
        this.deliveredDate = new Date();
    } else if (newStatus === 'completed') {
        this.completedDate = new Date();
    }
    
    return this.save();
};

module.exports = mongoose.model('Consolidation', consolidationSchema);