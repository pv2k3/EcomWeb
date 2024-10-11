const {
    Accessory, 
    Desktop, 
    Laptop
} = require("../models/STOCK");

async function getAllRecords(){
    const laptop = await Laptop.find({}, {_id:0});
    const desktop = await Desktop.find({}, {_id:0});
    const accessory = await Accessory.find({}, {_id:0});

    return [{
        item: laptop,
        type: "laptop"
    }, {
        item: desktop,
        type: "desktop"
    }, {
        item: accessory,
        type: "accessory"
    }]
}

module.exports = getAllRecords;