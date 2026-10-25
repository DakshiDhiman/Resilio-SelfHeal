const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
const Supplier = require('../datamodels/Supplier');

// Generate the next sequential supplier code.
async function generateNextSupplierCode() {
    const [totalCount, numberedSuppliers] = await Promise.all([
        Supplier.countDocuments(),
        Supplier.find({
            supplierCode: /^SUP-\d+$/i
        })
            .select('supplierCode')
            .lean()
    ]);

    const highestNumber = numberedSuppliers.reduce((highest, supplier) => {
        const match = supplier.supplierCode.match(/^SUP-(\d+)$/i);

        return match
            ? Math.max(highest, Number(match[1]))
            : highest;
    }, 0);

    const nextNumber = Math.max(totalCount, highestNumber) + 1;

    return `SUP-${String(nextNumber).padStart(3, '0')}`;
}

// PREVIEW: Get the next supplier code when Add Supplier opens.
router.get('/next-code', async (req, res) => {
    try {
        const supplierCode = await generateNextSupplierCode();

        res.status(200).json({
            success: true,
            data: { supplierCode }
        });
    } catch (error) {
        console.error('Supplier code generation error:', error);

        res.status(500).json({
            success: false,
            message: 'Could not generate the next supplier code.'
        });
    }
});

// CREATE: Add a supplier with an automatically generated code.
router.post('/', async (req, res) => {
    try {
        const {
            name,
            contactPerson,
            phone,
            email,
            address
        } = req.body;

        let supplier = null;

        // Retry a duplicate-code collision if another request
        // creates the same code at the same time.
        for (let attempt = 0; attempt < 5; attempt++) {
            const supplierCode = await generateNextSupplierCode();

            try {
                supplier = await Supplier.create({
                    supplierCode,
                    name,
                    contactPerson,
                    phone,
                    email,
                    address
                });

                break;
            } catch (error) {
                const supplierCodeConflict =
                    error.code === 11000 &&
                    (
                        error.keyPattern?.supplierCode ||
                        error.message?.includes('supplierCode_1')
                    );

                if (supplierCodeConflict && attempt < 4) {
                    continue;
                }

                throw error;
            }
        }

        if (!supplier) {
            throw new Error(
                'Could not generate a unique supplier code. Please try again.'
            );
        }

        res.status(201).json({
            success: true,
            message: `Supplier added successfully. Supplier code: ${supplier.supplierCode}`,
            data: supplier
        });
    } catch (error) {
        console.error('Add supplier error:', error);

        res.status(error.code === 11000 ? 409 : 400).json({
            success: false,
            message: error.code === 11000
                ? 'A duplicate supplier code or other unique value already exists.'
                : error.message
        });
    }
});

// READ: Get all active suppliers.
// Use ?includeInactive=true to include deactivated suppliers.
router.get('/', async (req, res) => {
    try {
        const filter =
            req.query.includeInactive === 'true'
                ? {}
                : { isActive: true };

        const suppliers = await Supplier.find(filter)
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: suppliers.length,
            data: suppliers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// READ: Get one supplier by ID.
router.get('/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid supplier ID.'
            });
        }

        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: supplier
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// UPDATE: Edit supplier details.
// The automatically generated supplier code is not editable.
router.put('/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid supplier ID.'
            });
        }

        const allowedFields = [
            'name',
            'contactPerson',
            'phone',
            'email',
            'address'
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Provide at least one valid field to update.'
            });
        }

        const supplier = await Supplier.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            {
                returnDocument: 'after',
                runValidators: true
            }
        );

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Supplier updated successfully.',
            data: supplier
        });
    } catch (error) {
        res.status(error.code === 11000 ? 409 : 400).json({
            success: false,
            message: error.code === 11000
                ? 'A duplicate value already exists.'
                : error.message
        });
    }
});

// DELETE: Soft-delete a supplier.
// Historical records remain preserved.
router.delete('/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid supplier ID.'
            });
        }

        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found.'
            });
        }

        if (!supplier.isActive) {
            return res.status(200).json({
                success: true,
                message: 'Supplier is already deactivated.'
            });
        }

        supplier.isActive = false;
        await supplier.save();

        res.status(200).json({
            success: true,
            message: 'Supplier deactivated successfully.',
            data: supplier
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;