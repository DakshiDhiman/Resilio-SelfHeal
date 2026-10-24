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
            // Step 1: Find the ingredient
            const ingredient = await Ingredient.findById(
                ingredientId
            ).session(session);

            if (!ingredient) {
                throw new Error('Ingredient not found.');
            }

            // Step 2: Calculate the actual quantity from all batches
            const batchTotals = await StockBatch.aggregate([
                {
                    $match: {
                        ingredientId: ingredient._id
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

            // Step 3: Read the currently stored total
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

            // Step 4: If quantities match, no repair is necessary
            if (!mismatch) {
                result = {
                    success: true,
                    repaired: false,
                    ingredient: ingredient.name,
                    previousQuantity,
                    expectedQuantity,
                    currentQuantity: existingStock.totalQuantity,
                    message: 'Stock totals match. No repair needed.'
                };

                return;
            }

            // Step 5: Automatically repair the stored total
            const updatedStock = await StockQuantity.findOneAndUpdate(
                {
                    ingredientId: ingredient._id
                },
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

            // Step 6: Verify that the correction was successful
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
