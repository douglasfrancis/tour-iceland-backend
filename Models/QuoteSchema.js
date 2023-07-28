const mongoose = require("mongoose")

const quoteSchema = new mongoose.Schema({
    guideId: String,
    requestId: String,
    guideFee: String,
    carFee: String,
    fuelFee: String,
    foodFee: String,
    accommodationFee: String,
    ownFee: String,
    vatRate: String,
    customerGross: String,
    message: String,
    hasPaid: {
      type: Boolean,
      default: false, // ensure default is unpaid
    },
    updatedAt: Date
  });

const Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote