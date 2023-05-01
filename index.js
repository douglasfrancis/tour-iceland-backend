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

//Emails
const emailWelcome = require('./Sendgrid/Welcome')
const emailNewRequest = require('./Sendgrid/NewRequest')
const emailClientFromInbox = require('./Sendgrid/EmailClient')

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
  //Bookings
  app.post('/create-new-booking', async (req, res)=>{
    try {
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
      //return all guides to email
      let guides = await Guide.find()

      newRequest.save().then((doc)=>{
      //Email guides
        //guides.map((guide)=> emailNewRequest(guide.email, date, info))
        emailNewRequest('dougiefrancis@gmail.com', date, info, doc._id)
      }).catch((e)=>console.log(e))
       
   
      
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

  app.post('/send-initial-quote', async (req, res)=>{
    try {
      let {guideId, guideName, guideEmail,net, vat, msg, clientEmail, clientName, requestId} = req.body;
      //Create inbox between guide and client
      let chat = new Chat({guideId, guideName, guideEmail, clientName, clientEmail, requestId, lastMsgAdded: new Date()})
      chat.save().then(async (doc)=>{
        //Add initial msg and quote to inbox
        let message = new Message({chatId: doc._id, message: `Quote - kr${Math.round((net*vat)*1.125)}. ${msg}`, guideId, read: true, timeStamp: new Date(), sentBy: 'Guide'})
        await message.save()
        //Email client with quote and link to respond
        emailClientFromInbox(clientEmail, doc._id)
        res.send('Successfully created')
      }).catch((e)=>{
        console.log(e)
        res.status(400).send(e)
      })
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

app.post('/send-client-message', async (req, res)=>{
  try {
    let msg = new Message(req.body)
    await msg.save()

    //Email guide to notify of new msg
    //emailClientFromInbox(req.body.clientEmail, req.body.chatId)

    //Update Chat last message received
    await Chat.findByIdAndUpdate(req.body.chatId, {lastMsgAdded: new Date()})

    res.send("Message sent")
  } catch (error) {
    res.status(400).send(error)
  }
})



async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
}
main().then(()=>console.log("Connected to MongoDB")).catch(err => console.log("Error", err));


app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})