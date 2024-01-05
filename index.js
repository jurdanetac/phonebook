require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const Person = require("./models/person");

const app = express();

app.use(express.json());
app.use(express.static("dist"));
app.use(cors());

// create token that returns string of body data sent in post request
morgan.token("data", (request, response) =>
  request.method === "POST" ? JSON.stringify(request.body) : "",
);

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :data"),
);

let phonebook = [];

app.get("/", (request, response) => {
  response.send("<h1>Phonebook</h1>");
});

app.get("/info", (request, response) => {
  const now = Date();

  response.send(
    `<p>phonebook has info for ${phonebook.length} people</p><p>${now}</p>`,
  );
});

app.get("/api/persons/:id", (request, response) => {
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

app.delete("/api/persons/:id", (request, response) => {
  // get sent id and convert it to number
  const id = request.params.id;
  // find person with that id
  const person = phonebook.find((p) => p.id === id);

  if (person) {
    phonebook = phonebook.filter((p) => p.id !== id);
  }

  response.status(204).end();
});

app.get("/api/persons/", (request, response) => {
  response.json(phonebook);
});

app.post("/api/persons/", (request, response) => {
  // generated id
  let id;

  // prevent duplicates
  do {
    id = String(Math.round(Math.random() * (1000 - 1) + 1));
  } while (phonebook.filter((p) => p.id === id).length);

  // create person object
  const person = { id: id, ...request.body };

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

  // update phonebook
  phonebook = phonebook.concat(person);
  // console.log(phonebook);

  response.status(200).end();
});

// fetch db for phonebook entries and then start app
Person.find({}).then((result) => {
  phonebook = result;

  const PORT = process.env.PORT;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
