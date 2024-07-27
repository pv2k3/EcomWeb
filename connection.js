const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

function connectMongoDb(url){
    mongoose.connect(url)
    .then(console.log("Mongodb Connected"))
    .catch(err => console.log(err));
}

module.exports = {connectMongoDb};