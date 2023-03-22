const express = require('express')
const app = express()

const bodyParser = require("body-parser")
app.use(bodyParser.urlencoded({ extended: false }))

const cors = require('cors')
app.use(cors())

require('dotenv').config()

const mongoose = require('mongoose')
const Schema = mongoose.Schema;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html")
})

app.use(express.static(__dirname + "/public"))

mongoose.connect(process.env.MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true });

const personSchema = new Schema({
  username: {
    required: true,
    type: String
  }
})

let personModel = mongoose.model("person", personSchema)

let exerciseSchema = new Schema({
  userId: {
    type: String
  },
  description: {
    type: String
  },
  duration: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now()
  },
  username: {
    type: String
  }
})

var exerciseModel = mongoose.model("exercise", exerciseSchema)

app.use((req, res, next) => {
  console.log("method: " + req.method)
  console.log("path: " + req.path)
  console.log("ip: " + req.ip)
  next()
})

app.post("/api/exercise/new-user", (req, res) => {
  let person = personModel({
    username: req.body.username
  })

  personModel.find({ username: req.body.username }, (err, data) => {
    if (err) {
      console.log(err)
    } else {
      if (data.length >= 1) {
        res.json({ message: "Username already exists" })
      } else {
        person.save((err, info) => {
          if (err) {
            res.json(err)
          } else {
            res.json(info)
          }
        })
      }
    }
  })
})

app.post("/api/exercise/add", (req, res) => {
  if (req.body.date === "") {
    req.body.date = Date.now()
  }
  personModel.find({ _id: req.body.userId }, (err, data) => {
    if (err) {
      console.log(err)
    } else {
      let exerciseTracker = new exerciseModel({
        userId: req.body.userId,
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date,
        username: data[0].username
      })

      exerciseTracker.save((err, exData) => {
        if (err) {
          res.json(err)
        } else {
          res.json(exData)
        }
      })
    }
  })
})

app.get("/api/exercise/users", (req, res) => {
  personModel.find({ userId: req.query.userId }, (err, data) => {
    if (err) {
      res.json(err)
    } else {
      res.json(data)
    }
  })
})

app.get("/api/exercise/log", (req, res) => {
  exerciseModel.find({ userId: req.query.userId }, (err, data) => {
    let obj = {
      count: data.length,
      userId: data
    }
    if (err) {
      res.json(err)
    } else {
      res.json(obj)
    }
  })
})

app.get("/api/exercise/otherlog", (req, res) => {
  let from = req.query.from;
  let to = req.query.to;
  let parseFrom = Date.parse(from)
  let parseTo = Date.parse(to) + 86400000
  let total = parseInt(req.query.limit)
  exerciseModel.find({ userId: req.query.userId }, (err, data) => {
    if (err) {
      res.json(err)
    } else {
      let arr = [];
      data.filter(i => {
        if (Date.parse(i.date) >= parseFrom && Date.parse(i.date) <= parseTo) {
          arr.push(i)
        } else {
          res.json({ message: "No entries for selected range" })
        }
      })
      res.json(arr)
    }
  })
    .limit(total)
    .exec((err, data) => {
      if (err) {
        console.log(err)
      } else {
        console.log(data)
      }
    })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
