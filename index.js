require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const Person = require("./models/person");

const app = express();

app.use(express.static("dist"));
app.use(express.json());

// create token that returns string of body data sent in post request
morgan.token("data", (request, response) =>
  request.method === "POST" ? JSON.stringify(request.body) : "",
);

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :data"),
);

app.use(cors());

// all endpoints update the phonebook with the server's one to ensure the user
// gets the complete info when performing a create/read/update/delete operation
let phonebook = [];

const updatePhonebookAndExecute = (func) => {
  Person.find({}).then((result) => {
    phonebook = result;
    console.log("phonebook updated successfully");
    console.log("phonebook:");
    console.log(phonebook);
    if (func) {
      func();
    }
  });
};

app.get("/", (request, response) => {
  response.send("<h1>Phonebook</h1>");
});

app.get("/info", (request, response) => {
  updatePhonebookAndExecute(() => {
    const now = Date();

    response.send(
      `<p>phonebook has info for ${phonebook.length} people</p><p>${now}</p>`,
    );
  });
});

app.get("/api/persons/:id", (request, response) => {
  updatePhonebookAndExecute(() => {
    // get sent id and convert it to number
    const id = request.params.id;
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

app.delete("/api/persons/:id", (request, response, next) => {
  updatePhonebookAndExecute(() => {
    // get sent id and convert it to number
    const id = request.params.id;

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

app.get("/api/persons/", (request, response) => {
  updatePhonebookAndExecute(() => response.json(phonebook));
});

app.post("/api/persons/", (request, response, next) => {
  updatePhonebookAndExecute(() => {
    // create person object
    const person = new Person({ ...request.body });

    // if a value is missing return error 400 bad request
    if (!(person.name && person.number)) {
      return response.status(400).json({
        error: "content missing",
      });
      // if name is already in phonebook return error 409 conflict
    } else if (
      phonebook.find(
        (p) => p.name.trim().toLowerCase() === person.name.toLowerCase(),
      )
    ) {
      return response.status(409).json({
        error: "name must be unique",
      });
    }

    person
      .save()
      .then(() => {
        console.log("person saved to phonebook successfully");
        response.status(200).end();
      })
      .catch((error) => next(error));
  });
});

app.put("/api/persons/:id", (request, response, next) => {
  updatePhonebookAndExecute(() => {
    // const person = new Person({ ...request.body });
    const id = request.params.id;

    const person = { ...request.body };

    if (phonebook.find((p) => p.id === id)) {
      // update on db if exists
      Person.findByIdAndUpdate(id, person, { new: true })
        .then((updatedPerson) => {
          console.log("updated person successfully", updatedPerson);
          // update local copy of phonebook
          updatePhonebookAndExecute();
        })
        .catch((error) => next(error));
    } else {
      response.status(404).end();
    }

    response.status(200).end();
  });
});

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

// handler of requests with unknown endpoint
app.use(unknownEndpoint);

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  }

  next(error);
};

// handler of requests with result to errors
app.use(errorHandler);

// fetch db for phonebook entries and then start app
updatePhonebookAndExecute(() => {
  const PORT = process.env.PORT;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
