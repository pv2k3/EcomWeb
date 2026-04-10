const { Accessory, Desktop, Laptop } = require("../models/STOCK");

async function getAllRecords() {
    const laptop = await Laptop.find();
    const desktop = await Desktop.find();
    const accessory = await Accessory.find();
    return [
        { item: laptop, type: "laptop" },
        { item: desktop, type: "desktop" },
        { item: accessory, type: "accessory" }
    ];
}

module.exports = getAllRecords;
