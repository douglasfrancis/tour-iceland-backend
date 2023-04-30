const mongoose = require("mongoose")

const chatSchema = new mongoose.Schema({
    guideId: String,
    guideName: String,
    guideEmail: String,
    clientName: String,
    clientEmail: String,
    requestId: String,
    lastMsgAdded: Date
  });

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat