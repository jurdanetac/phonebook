const mongoose = require('mongoose');

const password = process.argv[2];
const url = `mongodb+srv://fullstack:${password}@cluster0.maqhido.mongodb.net/?retryWrites=true&w=majority`;

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
});
const Person = mongoose.model('Person', personSchema);

mongoose.set('strictQuery', false);
mongoose.connect(url);

const name = process.argv[3];
const number = process.argv[4];
const person = new Person({ name, number });

switch (process.argv.length) {
  case 3:
    Person.find({}).then((result) => {
      console.log('phonebook:');
      result.forEach((p) => {
        console.log(p.name, p.number);
      });
      mongoose.connection.close();
      process.exit(0);
    });
    break;

  case 5:
    person.save().then(() => {
      console.log(`added ${name} number ${number} to phonebook`);
      mongoose.connection.close();
    });
    break;

  default:
    console.log('usage for query: node mongo.js yourpassword');
    console.log(
      'usage for adding: node mongo.js yourpassword Anna 040-1234556',
    );
    process.exit(1);
    break;
}
