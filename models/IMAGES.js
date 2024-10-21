const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: true
    },
    contentType: {
        type: String, 
        required: true
    },
    image : {
        type: Buffer, 
        required: true
    }
})


const Image = new mongoose.model("Image", imageSchema);

module.exports = Image;