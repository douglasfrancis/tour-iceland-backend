const mongoose = require("mongoose")

const requestSchema = new mongoose.Schema({
    title: String,
    date: String,
    name: String,
    email: String,
    info: Object,
    notes: String,
    currency: String,
    backgroundColor: String,
    borderColor: String,
    textColor: String
  });

const Request = mongoose.model('Request', requestSchema);

module.exports = Request