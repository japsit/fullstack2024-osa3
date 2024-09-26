const mongoose = require("mongoose")

if (process.argv.length < 3) {
    console.log('Give password as an argument')
    process.exit(1)
}

const password = process.argv[2]

const url = `mongodb+srv://juhasarkkinen:${password}@cluster0.ivyar.mongodb.net/puhelinluetteloApp?retryWrites=true&w=majority&appName=cluster0`
mongoose.set('strictQuery', false)
mongoose.connect(url)

// Määritellään mongon schema ja person malli
const personSchema = new mongoose.Schema({
    name: String,
    number: String
})

const Person = mongoose.model('Person', personSchema)

if (process.argv.length > 4) {
    const name = process.argv[3]
    const number = process.argv[4]

    const person = new Person({
        name: name,
        number: number,
    })
    person.save().then(results => {
        console.log(`added ${name} ${number} to phonebook`)
        mongoose.connection.close()
    })
} else {
    Person.find({}).then(result=> {
        console.log('phonebook:')
        result.forEach(person => {
            console.log(`${person.name} ${person.number}`)
        })
        mongoose.connection.close()
    })
}



