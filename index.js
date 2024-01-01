const express = require("express");
const app = express();

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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
