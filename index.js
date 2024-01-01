const express = require("express");
const app = express();

app.use(express.json());

let phonebook = [
  {
    id: 1,
    name: "Arto Hellas",
    number: "040-123456",
  },
  {
    id: 2,
    name: "Ada Lovelace",
    number: "39-44-5323523",
  },
  {
    id: 3,
    name: "Dan Abramov",
    number: "12-43-234345",
  },
  {
    id: 4,
    name: "Mary Poppendieck",
    number: "39-23-6423122",
  },
];

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
  const id = Number(request.params.id);
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
  const id = Number(request.params.id);
  // find person with that id
  const person = phonebook.find((p) => p.id === id);

  if (person) {
    phonebook = phonebook.filter((p) => p.id !== id);
  }

  response.status(204).end();
});

app.post("/api/persons/", (request, response) => {
  // generated id
  let id;

  // prevent duplicates
  do {
    id = Math.round(Math.random() * (1000 - 1) + 1);
  } while (phonebook.filter((p) => p.id === id).length);

  const person = request.body;
  person.id = id;

  phonebook = phonebook.concat(person);

  response.status(200).end();
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
