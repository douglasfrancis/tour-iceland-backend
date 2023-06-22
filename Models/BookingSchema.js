const mongoose = require("mongoose")

const bookingSchema = new mongoose.Schema({
    title: String,
    guideId: String,
    requestId: String,
    date: String,
    type: String,
    groupMembers: Array,
    notes: String
  });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking