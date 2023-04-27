const mongoose = require("mongoose")

const guideSchema = new mongoose.Schema({
    _id: String,
    firstName: String,
    lastName: String,
    email: String,
    number: String,
    img: String,
  
  });

const Guide = mongoose.model('Guide', guideSchema);

module.exports = Guide