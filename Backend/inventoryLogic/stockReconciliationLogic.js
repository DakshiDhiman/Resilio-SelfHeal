
const mongoose = require('mongoose');

const Ingredient = require('../datamodels/Ingredient');
const StockBatch = require('../datamodels/StockBatch');
const StockQuantity = require('../datamodels/StockQuantity');

const reconcileIngredient = async (ingredientId) => {
    if (!mongoose.isValidObjectId(ingredientId)) {
        throw new Error('Invalid ingredient ID.');
    }

    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            const ingredient = await Ingredient.findById(
                ingredientId
            ).session(session);

            if (!ingredient) {
                throw new Error('Ingredient not found.');
            }

            const now = new Date();

            // Count only active, non-expired stock.
            const batchTotals = await StockBatch.aggregate([
                {
                    $match: {
                        ingredientId: ingredient._id,
                        status: 'ACTIVE',
                        quantityRemaining: { $gt: 0 },
                        $or: [
                            { expiryDate: null },
                            { expiryDate: { $gt: now } }
                        ]
                    }
                },
                {
                    $group: {
                        _id: '$ingredientId',
                        totalQuantity: {
                            $sum: '$quantityRemaining'
                        }
                    }
                }
            ]).session(session);

            const expectedQuantity =
                batchTotals.length > 0
                    ? batchTotals[0].totalQuantity
                    : 0;

            const existingStock = await StockQuantity.findOne({
                ingredientId: ingredient._id
            }).session(session);

            const previousQuantity = existingStock
                ? existingStock.totalQuantity
                : null;

            const tolerance = 0.000001;

            const mismatch =
                !existingStock ||
                Math.abs(
                    existingStock.totalQuantity - expectedQuantity
                ) > tolerance;

            if (!mismatch) {
                result = {
                    success: true,
                    repaired: false,
                    ingredient: ingredient.name,
                    previousQuantity,
                    expectedQuantity,
                    currentQuantity: existingStock.totalQuantity,
                    message: 'Usable stock totals match. No repair needed.'
                };

                return;
            }

            await StockQuantity.findOneAndUpdate(
                { ingredientId: ingredient._id },
                {
                    $set: {
                        totalQuantity: expectedQuantity,
                        lastUpdatedAt: new Date()
                    }
                },
                {
                    session,
                    returnDocument: 'after',
                    upsert: true,
                    runValidators: true,
                    setDefaultsOnInsert: true
                }
            );

            const verifiedStock = await StockQuantity.findOne({
                ingredientId: ingredient._id
            }).session(session);

            if (
                !verifiedStock ||
                Math.abs(
                    verifiedStock.totalQuantity - expectedQuantity
                ) > tolerance
            ) {
                throw new Error(
                    'Stock reconciliation verification failed.'
                );
            }

            result = {
                success: true,
                repaired: true,
                ingredient: ingredient.name,
                previousQuantity,
                expectedQuantity,
                currentQuantity: verifiedStock.totalQuantity,
                message: 'Stock mismatch detected and repaired.'
            };
        });

        return result;
    } finally {
        await session.endSession();
    }
};

module.exports = {
    reconcileIngredient
};
