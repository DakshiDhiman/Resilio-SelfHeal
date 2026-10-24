const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema(
    {
        // Customer details
        customerName: {
            type: String,
            required: [true, 'Customer name is required.'],
            trim: true,
            minlength: [2, 'Name must contain at least 2 characters.'],
            maxlength: [80, 'Name cannot exceed 80 characters.']
        },

        mobileNumber: {
            type: String,
            required: [true, 'Mobile number is required.'],
            trim: true,
            match: [
                /^[0-9]{10}$/,
                'Please enter a valid 10-digit mobile number.'
            ]
        },

        // Number of people in the group
        partySize: {
            type: Number,
            required: [true, 'Number of people is required.'],
            min: [1, 'At least 1 person is required.'],
            max: [
                20,
                'For groups larger than 20, please contact the restaurant.'
            ],
            validate: {
                validator: Number.isInteger,
                message: 'Number of people must be a whole number.'
            }
        },

        // How the customer joins
        arrivalType: {
            type: String,
            enum: ['onsite', 'remote'],
            required: [true, 'Arrival type is required.']
        },

        // Unique customer queue token
        tokenNumber: {
            type: String,
            required: true,
            unique: true,
            immutable: true,
            trim: true
        },

        // Queue progress
        status: {
            type: String,
            enum: [
                'Waiting',
                'Your Turn',
                'Seated',
                'Completed'
            ],
            default: 'Waiting',
            required: true
        },

        // Estimated waiting time in minutes
        estimatedWaitMinutes: {
            type: Number,
            min: 0,
            default: 0
        },

        // Table assigned by the restaurant system
        tableId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Table',
            default: null
        },

        // Remote-arrival tracking
        arrivalConfirmed: {
            type: Boolean,
            default: false
        },

        // Time when the customer was called
        calledAt: {
            type: Date,
            default: null
        },

        // Time when the customer was seated
        seatedAt: {
            type: Date,
            default: null
        },

        // Time when the queue entry was completed
        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Retrieve queue entries by status and creation order
queueSchema.index({ status: 1, createdAt: 1 });

// Find a customer's queue entries
queueSchema.index({ mobileNumber: 1, createdAt: -1 });

module.exports = mongoose.model('Queue', queueSchema);
