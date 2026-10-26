
const mongoose = require('mongoose');

const processedInventoryOperationSchema = new mongoose.Schema(
  {
    operationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    operationType: {
      type: String,
      required: true,
      enum: ['STOCK_IN', 'STOCK_OUT'],
    },

    result: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  'ProcessedInventoryOperation',
  processedInventoryOperationSchema
);
