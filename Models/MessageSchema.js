const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({
    chatId: String,
    message: String,
    guideId: String,
    read: Boolean,
    timeStamp: Date,
    sentBy: String
  });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message