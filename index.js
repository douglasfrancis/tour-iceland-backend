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

  app.post('/create-new-guide', async (req, res)=>{
    try {
      let newGuide = new Guide(req.body)
      await newGuide.save()
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
      let newRequest = new Request(req.body)
      await newRequest.save()
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



async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
}
main().then(()=>console.log("Connected to MongoDB")).catch(err => console.log("Error", err));


app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})