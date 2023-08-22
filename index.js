var express = require('express')
const helmet = require("helmet");
var mongoose = require('mongoose')
require('dotenv').config()
var cors = require('cors')
var bodyParser = require('body-parser')

var app = express()
var port = process.env.PORT || 4000

//middleware
app.use(cors())
app.use(bodyParser.json())
app.use(helmet());

//models
const Guide = require('./Models/GuideSchema')
const Booking = require('./Models/BookingSchema')
const Request = require('./Models/RequestSchema')
const Chat = require('./Models/ChatSchema')
const Message = require('./Models/MessageSchema')
const Quote = require('./Models/QuoteSchema')

//Emails
const emailWelcome = require('./Sendgrid/Welcome')
const emailNewRequest = require('./Sendgrid/NewRequest')
const emailClientFromInbox = require('./Sendgrid/EmailClient')
const emailGuideFromInbox = require('./Sendgrid/EmailGuide')
const emailGuideBookingConfirmation = require('./Sendgrid/GuideBookingConfirmation')
const emailClientBookingConfirmation = require('./Sendgrid/ClientBookingConfirmation')
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.get('/', async (req, res)=>{
  res.send("Welcome to Tour Iceland")
})

//Guides
app.get('/get-guides', async (req, res)=>{
  try {
    let guides = await Guide.find()
    res.send(guides)
  } catch (error) {
    res.status(400).send(error)
  }
})

app.post('/get-guide-by-id', async (req, res)=>{
  try {
    let {id} = req.body
    let guide = await Guide.findById(id)
    res.send(guide)
  } catch (error) {
    res.status(400).send(error)
  }
})

app.post('/create-new-guide', async (req, res)=>{
  try {
    let newGuide = new Guide(req.body)
    await newGuide.save()
    emailWelcome(req.body.email, req.body.firstName)
    res.send("Created Successfully")
  } catch (error) {
    res.status(400).send(error)
  }
})

app.post('/update-guide-personal', async (req, res)=>{
  try {
    let {id, firstName, lastName, number, img} = req.body
    await Guide.findByIdAndUpdate(id, {firstName, lastName, number, img})
    res.send("Updated Successfully")
  } catch (error) {
    res.status(400).send(error)
  }
})

  
// Bookings
app.post('/create-new-booking', async (req, res) => {
  try {
    const { guideId, requestId } = req.body;
    // Check if booking already exists with the same guideId and requestId
    // note that in the case of a manually created booking, it is not going
    // to have a request id
    const existingBooking = await Booking.findOne({ guideId, requestId });

    if (existingBooking) {
      res.status(409).send('Booking already exists');
      return;
    }
    let newBooking = new Booking(req.body)
    await newBooking.save()
    res.send("Created Successfully")
  } catch (error) {
    res.status(400).send(error)
  }
})

app.post('/get-bookings-by-id', async (req, res)=>{
  try {
    let { id} = req.body
    let bookings = await Booking.find({guideId: id})
    res.send(bookings)
  } catch (error) {
    res.status(400).send(error)
  }
})

//Requests
app.post('/create-new-request', async (req, res)=>{
  try {
    let {date, info} = req.body;
    let newRequest = new Request(req.body)

    // get all the guides to be emailed
    let guides = await Guide.find()

    newRequest.save().then((doc)=>{
      // Email guides
      guides.map((guide) => {
        emailNewRequest(guide.email, date, info, doc._id)
      })
    }).catch((e) => {
      console.log(e)
    })

    res.send("Created Successfully")
  } catch (error) {
    res.status(400).send(error)
  }
})

app.get('/get-requests', async (req, res)=>{
  try {
    let requests = await Request.find()
    res.send(requests)
  } catch (error) {
    res.status(400).send(error)
  }
})

app.post('/get-request-by-id', async (req, res)=>{
  try {
    let {id} = req.body;
    let request = await Request.findById(id)
    res.send(request)
  } catch (error) {
    res.status(400).send(error)
  }
})

// quotes
app.put('/update-quote/:id', async (req, res) => {
  const { id } = req.params;
  const { updatedQuote } = req.body;
  try {
    const updatedData = await Quote.findByIdAndUpdate(id, updatedQuote, { new: false });
    res.json(updatedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update quote' });
  }
});

app.get('/get-quote-by-id/:id', async (req, res)=>{
  try {
    const { id } = req.params;
    let quote = await Quote.findById(id)
    res.send(quote)
  } catch (error) {
    res.status(400).send(error)
  }
})

app.post('/get-quotes-for-guide', async (req, res) => {
  try {
    const { guideId } = req.params;
    let quotes = await Quote.find(guideId)
    res.send(quotes)
  } catch (error) {
    res.status(400).send(error)
  }
})

app.post('/get-guide-quote-for-request', async (req, res)=>{
  try {
    let {guideId, requestId} = req.body;
    let quote = await Quote.findOne({guideId, requestId})
    res.send(quote)
  } catch (error) {
    res.status(400).send(error)
  }
})

app.post('/send-booking-confirmations', async (req, res) => {
  try {
    let {request, guide} = req.body;
    emailClientBookingConfirmation(request.email, request.date, request.info.tourType)
    emailGuideBookingConfirmation(guide.email, request.date, request.info.tourType)
    res.send('Successfully created')
  } catch(error) {
    console.log(error)
    res.status(400).send(error)
  }
})


app.post('/send-initial-quote', async (req, res)=>{
  try {
    let {requestPayload, quotePayload} = req.body;
    let savedQuoteId
    try {
      const options = {
        upsert: true, // Create a new document if it doesn't exist
        new: true // Return the updated or newly created document
      };

      // create a new quote when there's none already, otherwise amend existing
      if (!quotePayload.quoteId) {
        quotePayload.quoteId = new mongoose.mongo.ObjectId();
      }
      const updatedQuote = await Quote.findOneAndUpdate(
        { _id: quotePayload.quoteId }, // Query for finding the document to update or create
        { $set: quotePayload },        // Updated data to be set
        options
      );

      // store the updated or newly created quote's _id
      savedQuoteId = updatedQuote._id;

    } catch (error) {
      res.status(400).send(error);
    }
    let {guideId, guideName, guideEmail, msg, clientEmail, clientName, requestId} = requestPayload;
    //Create inbox between guide and client
    // first see if we can find an existing chat for that guide and request
    let chat
    try {
      chat = await Chat.findOne({guideId, requestId})
      if (!chat) {
        chat = new Chat({guideId, guideName, guideEmail, clientName, clientEmail, requestId, lastMsgAdded: new Date()})
        await chat.save()
      }
    } catch (error) {
      res.status(400).send(error)
    }

    try {
      //Add initial msg (or subsquent if updating a quote) and send it with quote to inbox
      let msgText = `Quote - ${savedQuoteId} - ${msg}`
      let message = new Message({chatId: chat._id, message: msgText, guideId, read: true, timeStamp: new Date(), sentBy: 'Guide'})
      await message.save()
      //Email client with quote and link to respond
      emailClientFromInbox(clientEmail, chat._id)
      res.send('Successfully created')
    } catch(e) {
      console.log(e)
      res.status(400).send(e)
    }
  } catch (error) {
    res.status(400).send(error)
  }
})

//Chats
app.post('/get-chats-by-id', async (req, res)=>{
  try {
    let {id} = req.body;
    let chats = await Chat.find({guideId:id})
    res.send(chats)
  } catch (error) {
    res.status(400).send(error)
  }
})

app.post('/get-chat-by-id', async (req, res)=>{
  try {
    let chat = await Chat.findById(req.body.chatId)
    res.send(chat)
  } catch (error) {
    res.status(400).send(error)
  }
})

//Messages
app.post('/get-unread-msgs', async (req, res)=>{
  try {
    let {id} = req.body;
    let unread = await Message.find({$and: [{guideId:id}, {read: false}]})
    res.send(unread)
  } catch (error) {
    res.status(400).send(error)
  }
})

app.post('/get-messages-by-chat-id', async (req, res)=>{
  try {
    let {chatId} = req.body;
    let msgs = await Message.find({chatId})
    res.send(msgs)
  } catch (error) {
    res.status(400).send(error)
  }
})

// send a message from a guide to a client
app.post('/send-guide-message', async (req, res)=>{
  try {
    let msg = new Message(req.body)
    await msg.save()

    //Email client to notify of new msg
    emailClientFromInbox(req.body.clientEmail, req.body.chatId)

    //Update Chat last message received
    await Chat.findByIdAndUpdate(req.body.chatId, {lastMsgAdded: new Date()})

    res.send("Message sent")
  } catch (error) {
    res.status(400).send(error)
  }
})

// send a message from a client to a guide
app.post('/send-client-message', async (req, res)=>{
  try {
    let msg = new Message(req.body)
    await msg.save()

    //Email guide to notify of new msg
    emailGuideFromInbox(req.body.guideEmail, req.body.chatId);

    //Update Chat last message received
    await Chat.findByIdAndUpdate(req.body.chatId, {lastMsgAdded: new Date()})

    res.send("Message sent")
  } catch (error) {
    res.status(400).send(error)
  }
})



app.post("/create-checkout-session", async (req, res) => { 
  const { product } = req.body; 
  const session = await stripe.checkout.sessions.create({ 
    payment_method_types: ["card"], 
    line_items: [ 
      { 
        price_data: { 
          currency: product.currency, 
          product_data: { 
            name: product.name, 
          }, 
          unit_amount: product.price * 100, 
        }, 
        quantity: product.quantity, 
      }, 
    ], 
    mode: "payment", 
    success_url: "http://localhost:3000/payments/success/" + product.quoteId, 
    cancel_url: "http://localhost:3000/payments/cancel"
  });
  res.json({ id: session.id }); 
}); 


async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
}
main().then(()=>console.log("Connected to MongoDB")).catch(err => console.log("Error", err));


app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})