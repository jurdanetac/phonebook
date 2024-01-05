const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

const URL = process.env.MONGODB_URI;

console.log("connecting to", URL);

mongoose
  .connect(URL)
  .then((result) => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.log("error connecting to MongoDB:", error.message);
  });

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    minLength: 3,
    required: [true, "User name required"],
  },
  number: {
    type: String,
    minLength: 8,
    validate: {
      validator: (v) => {
        return new RegExp("^([0-9]{2,3})(-)([0-9]{5,9})$").test(v);
      },
    },
    required: [true, "User phone number required"],
  },
});

personSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Person", personSchema);
