const express = require('express');
const app = express()
const morgan = require('morgan');
const cors = require('cors')

app.use(cors())
app.use(express.json());

morgan.token('response-body', (req, res) => {
  return res.locals.bodyContent || ''; // Lisää token, joka loggaa vastauksen sisällön
});

// Middleware, joka tallentaa vastauksen sisällön ennen sen lähettämistä
app.use((req, res, next) => {
  const originalSend = res.send;

  res.send = function (body) {
    res.locals.bodyContent = body;  // Tallennetaan vastaus, kun muuten näyttää häviävän
    return originalSend.apply(this, arguments);  // Lähetä alkuperäinen vastaus
  };

  next();
});

app.use((req, res, next) => {
  if (req.method === 'POST') {
    morgan(':method :url :status :res[content-length] - :response-time ms :response-body')(req, res, next)
  } else {
    morgan('tiny')(req, res, next)
  }
})


let persons = [
    {
      "id": "1",
      "name": "Arto Hellas",
      "number": "040-123456"
    },
    {
      "id": "2",
      "name": "Ada Lovelace",
      "number": "39-44-5323523"
    },
    {
      "id": "3",
      "name": "Dan Abramov",
      "number": "12-43-234345"
    },
    {
      "id": "4",
      "name": "Mary Poppendieck",
      "number": "39-23-6423122"
    }
  ]

  app.post('/api/persons', (request, response) => {
    const person = request.body
    const randomId = Math.floor(Math.random() * (1000000)) + 6
    person.id = "" + randomId

    let errors = []

    if (!person.name) {
        errors.push('Name is required.')
    }
    if (!person.number) {
        errors.push('Number is required.')
    }

    // Palauta 400 virheet
    if (errors.length > 0) {
        return response.status(400).send(errors.join(' '))
    }

    // Käsittele tilanne, jos nimi on jo luettelossa
    if (persons.some(a => a.name === person.name)) {
        return response.status(409).send('Name must be unique.')
    }

    persons.push(person)
    response.json(person)
  })

  app.get('/api/persons', (request, response) => {
    response.json(persons)
  })

  app.get('/api/persons/:id', (request, response) => {
    const id = request.params.id
    const person = persons.find(person => person.id === id)
    if (person === undefined) {
        response.status(404).end
    }
    response.json(person)
  })

  app.delete('/api/persons/:id', (request, response) => {
    const id = request.params.id
    persons = persons.filter(person => person.id !== id)
    response.status(204).end()
  })

  app.get('/info', (request, response) => {

    response.send(`<p>Phonebook has info for ${persons.length} people</p><p>${new Date()}</p>`)
  })
  
  const PORT = 3001
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
