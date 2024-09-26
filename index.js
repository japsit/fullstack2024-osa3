const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

app.use(cors())
app.use(express.json())

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }

  if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })  // Validointivirheet
  }

  // Jos mikään erityinen virhe ei täsmää, palautetaan yleinen 500-virhe
  if (!response.headersSent) {
    return response.status(500).send({ error: 'Something went wrong on the server' })
  }

  next(error)
}

morgan.token('response-body', (req, res) => {
  return res.locals.bodyContent || '' // Lisää token, joka loggaa vastauksen sisällön
})

// Middleware, joka tallentaa vastauksen sisällön ennen sen lähettämistä
app.use((req, res, next) => {
  const originalSend = res.send

  res.send = function (body) {
    res.locals.bodyContent = body  // Tallennetaan vastaus, kun muuten näyttää häviävän
    return originalSend.apply(this, arguments)  // Lähetä alkuperäinen vastaus
  }

  next()
})

app.use((req, res, next) => {
  if (req.method === 'POST') {
    morgan(':method :url :status :res[content-length] - :response-time ms :response-body')(req, res, next)
  } else {
    morgan('tiny')(req, res, next)
  }
})


app.post('/api/persons', (request, response, next) => {
  const { name, number } = request.body

  let errors = []

  if (!name) {
    errors.push('Name is required.')
  }
  if (!number) {
    errors.push('Number is required.')
  }

  // Palauta 400 virheet
  if (errors.length > 0) {
    const validationError = new Error(errors.join(' ')) // Luodaan virhe-objekti
    validationError.name = 'ValidationError' // Asetetaan virheen nimi, jotta errorHandler voi tunnistaa sen
    return next(validationError) // Välitetään virhe virheidenkäsittelyyn
  }

  // Käsittele tilanne, jos nimi on jo luettelossa
  Person.findOne({ name: name })
    .then(existingPerson => {
      if (existingPerson) {
        // Jos henkilö löytyy, palautetaan virheviesti
        return response.status(409).send('Name must be unique.')
      }

      // Jos nimeä ei löydy, jatka uuden henkilön tallentamista
      const person = new Person({
        name: name,
        number: number
      })

      person.save().then(results => {
        console.log(`added ${name} ${number} to phonebook`)
        response.json(results)
      })
        .catch(error => next(error)) // Savetus-virheen käsittely
    })
    .catch(error => next(error))
})


app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons.map(person => person.toJSON()))
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (!person) {
        return response.status(404).end()
      }
      response.json(person)
    })
    .catch(error => next(error))
})


app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(result => {
      if (!result) {
        // Jos henkilöä ei löydy tietokannasta, palautetaan 404
        return response.status(404).send({ error: 'Person not found' })
      }
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.get('/info', (request, response, next) => {
  Person.countDocuments({})
    .then(count => {
      response.send(`<p>Phonebook has info for ${count} people</p><p>${new Date()}</p>`)
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const { number } = request.body

  Person.findByIdAndUpdate(
    request.params.id,
    { number: number },
    { new: true, runValidators: true, context: 'query' }
  )
    .then(updatedPerson => {
      if (!updatedPerson) {
        return response.status(404).send({ error: 'Person not found' })
      }
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

app.use(errorHandler)

app.use(express.static('public'))


const PORT = 3001
app.listen(PORT, '0.0.0.0',() => {
  console.log(`Server running on port ${PORT}`)
})
