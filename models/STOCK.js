const mongoose = require("mongoose");
const cryto = require("node:crypto");

const nonTechInfo = {
    productName: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
    },
    qty: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true,
    },
    image: {
        type: String,
        required: true,
    }
}

const pcs = {
    ...nonTechInfo,
    specification: {
        processor: {
            type: String
        },
        ram: {
            type: String
        },
        storage: {
            type: String
        },
        battery: {
            type: String
        },
        graphicCard: {
            type: String
        }
    }
}


const laptopSchema = new mongoose.Schema(pcs)

const desktopSchema = new mongoose.Schema(pcs)

const accessorySchema = new mongoose.Schema({
    ...nonTechInfo,
    description: {
        type: String,
        required: true
    }
})

const Laptop = mongoose.model("laptop", laptopSchema);
const Desktop = mongoose.model("desktop", desktopSchema);
const Accessory = mongoose.model("accessories", accessorySchema);


module.exports = {
    Laptop,
    Desktop,
    Accessory
};