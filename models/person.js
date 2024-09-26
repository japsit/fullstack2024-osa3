const mongoose = require('mongoose')
require('dotenv').config()

const url = process.env.MONGODB_URI
console.log('connecting to', url)

mongoose.set('strictQuery', false)
mongoose.connect(url)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

// Määritellään mongon schema ja person malli
const personSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3,
  },
  number: {
    type: String,
    minlength: 8,
    validate: {
      validator: (v) => {
        return /^\d{2,3}-\d{4,}$/.test(v)
      },
      message: props => `${props.value} is not a valid phone number. It should be at 8 characters. Prefix should be 2-3 numbers. For example 09-123456`
    },
    required: true,
  },
})

personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Person', personSchema)

