
const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');

const router = express.Router();
const Queue = require('../datamodels/Queue');
const requireAdmin = require('../middleware/requireAdmin');

// FINAL QUEUE STATUSES
const WAITING_STATUSES = ['Waiting'];
const MINUTES_PER_PARTY = 10;

const QUEUE_STATUSES = [
    'Waiting',
    'Your Turn',
    'Seated',
    'Completed'
];

const ALLOWED_TRANSITIONS = {
    'Waiting': 'Your Turn',
    'Your Turn': 'Seated',
    'Seated': 'Completed',
    'Completed': null
};

// Generate a unique queue token
async function generateToken() {
    for (let attempt = 0; attempt < 5; attempt++) {
        const randomNumber = crypto.randomInt(1000, 10000);
        const token = `R-${randomNumber}`;

        const existingToken = await Queue.exists({
            tokenNumber: token
        });

        if (!existingToken) {
            return token;
        }
    }

    throw new Error('Unable to generate a unique queue token.');
}

// Recalculate waiting times and positions
async function recalculateQueueEstimates() {
    const waitingEntries = await Queue.find({
        status: { $in: WAITING_STATUSES }
    }).sort({ createdAt: 1, _id: 1 });

    const operations = waitingEntries.map((entry, index) => ({
        updateOne: {
            filter: { _id: entry._id },
            update: {
                $set: {
                    estimatedWaitMinutes:
                        index * MINUTES_PER_PARTY
                }
            }
        }
    }));

    if (operations.length > 0) {
        await Queue.bulkWrite(operations);
    }

    // Non-waiting customers no longer have an active wait estimate
    await Queue.updateMany(
        {
            status: { $nin: WAITING_STATUSES },
            estimatedWaitMinutes: { $ne: 0 }
        },
        {
            $set: { estimatedWaitMinutes: 0 }
        }
    );

    return waitingEntries;
}

// PUBLIC: Customer joins the queue
router.post('/join', async (req, res) => {
    try {
        const {
            customerName,
            mobileNumber,
            partySize,
            arrivalType
        } = req.body;

        if (
            !customerName ||
            !mobileNumber ||
            partySize === undefined ||
            !arrivalType
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required customer details.'
            });
        }

        const cleanName = String(customerName).trim();
        const cleanMobile = String(mobileNumber).trim();
        const people = Number(partySize);

        if (cleanName.length < 2 || cleanName.length > 80) {
            return res.status(400).json({
                success: false,
                message: 'Name must contain 2 to 80 characters.'
            });
        }

        if (!/^[0-9]{10}$/.test(cleanMobile)) {
            return res.status(400).json({
                success: false,
                message: 'Enter a valid 10-digit mobile number.'
            });
        }

        if (!Number.isInteger(people) || people < 1 || people > 20) {
            return res.status(400).json({
                success: false,
                message: 'Party size must be a whole number from 1 to 20.'
            });
        }

        if (!['onsite', 'remote'].includes(arrivalType)) {
            return res.status(400).json({
                success: false,
                message: 'Arrival type must be onsite or remote.'
            });
        }

       
let tokenNumber = await generateToken();
let queueEntry;
let tokenReassigned = false;

const entryData = {
    customerName: cleanName,
    mobileNumber: cleanMobile,
    partySize: people,
    arrivalType,
    tokenNumber,
    status: 'Waiting',
    estimatedWaitMinutes: 0,
    arrivalConfirmed: arrivalType === 'onsite'
};

try {
    queueEntry = await Queue.create(entryData);
} catch (error) {
    if (error.code !== 11000) {
        throw error;
    }

    // Generate a new token if a duplicate-key conflict occurs.
    tokenNumber = await generateToken();
    tokenReassigned = true;

    queueEntry = await Queue.create({
        ...entryData,
        tokenNumber
    });
}


        await recalculateQueueEstimates();

        const updatedEntry = await Queue.findById(queueEntry._id);

        const waitingEntries = await Queue.find({
            status: { $in: WAITING_STATUSES }
        }).sort({ createdAt: 1, _id: 1 });

        const index = waitingEntries.findIndex(
            entry => String(entry._id) === String(updatedEntry._id)
        );

        return res.status(201).json({
            success: true,
            message: 'You have joined the queue successfully.',
            data: {
                id: updatedEntry._id,
                tokenNumber: updatedEntry.tokenNumber,
                customerName: updatedEntry.customerName,
                partySize: updatedEntry.partySize,
                arrivalType: updatedEntry.arrivalType,
                status: updatedEntry.status,
                queuePosition: index >= 0 ? index + 1 : null,
                estimatedWaitMinutes:
                    updatedEntry.estimatedWaitMinutes,
                joinedAt: updatedEntry.createdAt
            },
             notification: {
        type: tokenReassigned ? 'token-reassigned' : 'queue-joined',
        title: tokenReassigned
            ? 'Your token was updated'
            : 'Queue joined successfully',
        message: tokenReassigned
            ? `A token conflict was detected. Your new token is ${updatedEntry.tokenNumber}. Please use this token to track your queue.`
            : `You have joined the queue successfully. Your token number is ${updatedEntry.tokenNumber}.`
    }
        });
    } catch (error) {
        console.error('Join queue error:', error);

        return res.status(error.code === 11000 ? 409 : 500).json({
            success: false,
            message: error.code === 11000
                ? 'A token conflict occurred. Please try joining again.'
                : 'Unable to join the queue. Please try again.'
        });
    }
});

// PUBLIC: Customer checks status using their token
router.get('/token/:tokenNumber', async (req, res) => {
    try {
        const tokenNumber = req.params.tokenNumber
            .trim()
            .toUpperCase();

        const entry = await Queue.findOne({ tokenNumber });

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Queue token not found. Please check your token number.'
            });
        }

        await recalculateQueueEstimates();

        const updatedEntry = await Queue.findById(entry._id);

        let queuePosition = null;

        if (updatedEntry.status === 'Waiting') {
            const waitingEntries = await Queue.find({
                status: { $in: WAITING_STATUSES }
            }).sort({ createdAt: 1, _id: 1 });

            const index = waitingEntries.findIndex(
                item => String(item._id) === String(updatedEntry._id)
            );

            queuePosition = index >= 0 ? index + 1 : null;
        }

        return res.json({
            success: true,
            data: {
                tokenNumber: updatedEntry.tokenNumber,
                status: updatedEntry.status,
                partySize: updatedEntry.partySize,
                queuePosition,
                estimatedWaitMinutes:
                    updatedEntry.estimatedWaitMinutes,
                joinedAt: updatedEntry.createdAt,
                calledAt: updatedEntry.calledAt || null,
                seatedAt: updatedEntry.seatedAt || null,
                completedAt: updatedEntry.completedAt || null
            }
        });
    } catch (error) {
        console.error('Queue status error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to check queue status.'
        });
    }
});

// ADMIN ONLY: View all queue entries
router.get('/', requireAdmin, async (req, res) => {
    try {
        await recalculateQueueEstimates();

        const entries = await Queue.find()
            .sort({ createdAt: 1, _id: 1 })
            .lean();

        return res.json({
            success: true,
            count: entries.length,
            data: entries
        });
    } catch (error) {
        console.error('Admin queue list error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve queue entries.'
        });
    }
});

// ADMIN ONLY: Update queue status
router.patch('/:id/status', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid queue entry ID.'
            });
        }

        if (!QUEUE_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid queue status.'
            });
        }

        const entry = await Queue.findById(id);

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Queue entry not found.'
            });
        }

        const expectedStatus = ALLOWED_TRANSITIONS[entry.status];

        if (expectedStatus !== status) {
            return res.status(400).json({
                success: false,
                message: entry.status === 'Completed'
                    ? 'This queue entry is already completed.'
                    : expectedStatus
                        ? `This entry can move from ${entry.status} to ${expectedStatus} only.`
                        : 'This entry has an unsupported old status. Please review it.'
            });
        }

        const now = new Date();

        entry.status = status;

        if (status === 'Your Turn') {
            entry.calledAt = now;
        }

        if (status === 'Seated') {
            entry.seatedAt = now;
        }

        if (status === 'Completed') {
            entry.completedAt = now;
        }

        await entry.save();
        await recalculateQueueEstimates();

        const updatedEntry = await Queue.findById(id).lean();

        return res.json({
            success: true,
            message: `Queue status updated to ${status}.`,
            data: updatedEntry
        });
    } catch (error) {
        console.error('Queue status update error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to update queue status.'
        });
    }
});

// ADMIN ONLY: Get one queue entry by database ID
router.get('/:id', requireAdmin, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid queue entry ID.'
            });
        }

        const entry = await Queue.findById(req.params.id);

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Queue entry not found.'
            });
        }

        return res.json({
            success: true,
            data: entry
        });
    } catch (error) {
        console.error('Get queue entry error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve queue information.'
        });
    }
});

module.exports = router;
