const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const StockQuantity = require("../datamodels/StockQuantity");
const StockBatch = require("../datamodels/StockBatch");

// Round monetary values to two decimal places.
function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

// Add remaining batch details and stock values to quantity records.
async function addBatchValues(quantityRecords) {
    const getIngredientId = (record) => {
        const ingredient = record.ingredientId;

        return ingredient && ingredient._id
            ? ingredient._id
            : ingredient;
    };

    const ingredientIds = quantityRecords
        .map(getIngredientId)
        .filter(Boolean);

    const batches = ingredientIds.length
        ? await StockBatch.find({
              ingredientId: { $in: ingredientIds },
              quantityRemaining: { $gt: 0 }
          })
              .select(
                  "batchCode ingredientId quantityRemaining unitCost receivedDate expiryDate status"
              )
              .sort({ receivedDate: 1, createdAt: 1 })
              .lean()
        : [];

    // Group batches by ingredient.
    const batchesByIngredient = new Map();

    for (const batch of batches) {
        const key = String(batch.ingredientId);

        const remainingQuantity =
            Number(batch.quantityRemaining) || 0;

        const unitCost = Number(batch.unitCost) || 0;

        const batchDetails = {
            _id: batch._id,
            batchCode: batch.batchCode,
            quantityRemaining: remainingQuantity,
            unitCost,
            lineValue: roundMoney(remainingQuantity * unitCost),
            receivedDate: batch.receivedDate,
            expiryDate: batch.expiryDate,
            status: batch.status
        };

        if (!batchesByIngredient.has(key)) {
            batchesByIngredient.set(key, []);
        }

        batchesByIngredient.get(key).push(batchDetails);
    }

    // Calculate the value of each ingredient from its remaining batches.
    return quantityRecords.map((record) => {
        const plainRecord = record.toObject
            ? record.toObject()
            : record;

        const ingredientId = getIngredientId(plainRecord);

        const ingredientBatches =
            batchesByIngredient.get(String(ingredientId)) || [];

        const stockValue = roundMoney(
            ingredientBatches.reduce(
                (total, batch) => total + batch.lineValue,
                0
            )
        );

        return {
            ...plainRecord,
            batches: ingredientBatches,
            stockValue
        };
    });
}

// READ: Get stock quantities for all ingredients.
router.get("/", async (req, res) => {
    try {
        const quantities = await StockQuantity.find()
            .populate(
                "ingredientId",
                "ingredientCode name category unit minimumStock isActive"
            )
            .sort({ lastUpdatedAt: -1 });

        const data = await addBatchValues(quantities);

        const totalStockValue = roundMoney(
            data.reduce(
                (total, item) => total + item.stockValue,
                0
            )
        );

        res.status(200).json({
            success: true,
            count: data.length,
            totalStockValue,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// READ: Get stock quantity for one ingredient.
router.get("/ingredient/:ingredientId", async (req, res) => {
    try {
        const { ingredientId } = req.params;

        if (!mongoose.isValidObjectId(ingredientId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ingredient ID."
            });
        }

        const quantity = await StockQuantity.findOne({
            ingredientId
        }).populate(
            "ingredientId",
            "ingredientCode name category unit minimumStock isActive"
        );

        if (!quantity) {
            return res.status(404).json({
                success: false,
                message:
                    "Stock quantity record not found for this ingredient."
            });
        }

        const [data] = await addBatchValues([quantity]);

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;