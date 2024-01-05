require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const Person = require('./models/person');

const app = express();

app.use(express.static('dist'));
app.use(express.json());

// create token that returns string of body data sent in post request
morgan.token('data', (request) => (request.method === 'POST' ? JSON.stringify(request.body) : ''));

app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms :data'),
);

app.use(cors());

// all endpoints update the phonebook with the server's one to ensure the user
// gets the complete info when performing a create/read/update/delete operation
let phonebook = [];

const updatePhonebookAndExecute = (func) => {
  Person.find({}).then((result) => {
    phonebook = result;
    console.log('phonebook updated successfully');
    console.log('phonebook:');
    console.log(phonebook);
    if (func) {
      func();
    }
  });
};

app.get('/', (request, response) => {
  response.send('<h1>Phonebook</h1>');
});

app.get('/info', (request, response) => {
  updatePhonebookAndExecute(() => {
    const now = Date();

    response.send(
      `<p>phonebook has info for ${phonebook.length} people</p><p>${now}</p>`,
    );
  });
});

app.get('/api/persons/:id', (request, response) => {
  updatePhonebookAndExecute(() => {
    // get sent id and convert it to number
    const { id } = request.params;
    // find person with that id
    const person = phonebook.find((p) => p.id === id);

    // if person exists return the phonebook entry else send error 404 not found
    if (person) {
      response.json(person);
    } else {
      response.status(404).end();
    }
  });
});

app.delete('/api/persons/:id', (request, response, next) => {
  updatePhonebookAndExecute(() => {
    // get sent id and convert it to number
    const { id } = request.params;

    // delete them in the db
    Person.findByIdAndDelete(id)
      .then(() => {
        // find person with that id in local phonebook
        const person = phonebook.find((p) => p.id === id);

        if (person) {
          // delete them in local copy of phonebook
          phonebook = phonebook.filter((p) => p.id !== id);
        }

        response.status(204).end();
      })
      .catch((error) => next(error));
  });
});

app.get('/api/persons/', (request, response) => {
  updatePhonebookAndExecute(() => response.json(phonebook));
});

app.post('/api/persons/', (request, response, next) => {
  updatePhonebookAndExecute(() => {
    // create person object
    const person = new Person({ ...request.body });

    // if a value is missing return error 400 bad request
    if (!(person.name && person.number)) {
      return response.status(400).json({
        error: 'content missing',
      });
      // if name is already in phonebook return error 409 conflict
    } if (
      phonebook.find(
        (p) => p.name.trim().toLowerCase() === person.name.toLowerCase(),
      )
    ) {
      return response.status(409).json({
        error: 'name must be unique',
      });
    }

    person
      .save()
      .then(() => {
        console.log('person saved to phonebook successfully');
        response.status(200).end();
      })
      .catch((error) => next(error));

    return undefined;
  });
});

app.put('/api/persons/:id', (request, response, next) => {
  updatePhonebookAndExecute(() => {
    // extract id and person data from request
    const { id } = request.params;
    const person = { ...request.body };

    // if person is in phonebook update it
    if (phonebook.find((p) => p.id === id)) {
      // options for update
      const opts = { runValidators: true, new: true };

      // update on db if exists
      Person.findOneAndUpdate({ _id: id }, person, opts)
        .then((updatedPerson) => {
          // update local copy of phonebook
          updatePhonebookAndExecute();
          console.log('updated person successfully', updatedPerson);
          response.status(200).end();
        })
        .catch((error) => next(error));
      // else return error 404 not found
    } else {
      response.status(404).end();
    }
  });
});

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' });
};

// handler of requests with unknown endpoint
app.use(unknownEndpoint);

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' });
  } if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message });
  }

  next(error);

  return undefined;
};

// handler of requests with result to errors
app.use(errorHandler);

// fetch db for phonebook entries and then start app
updatePhonebookAndExecute(() => {
  const { PORT } = process.env;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
