const {
    Laptop,
    Desktop,
    Accessory
} = require("../models/STOCK")
const Image = require("../models/IMAGES");
const User = require("../models/USER");

const fs = require("fs");
const crypto = require("node:crypto");
const { setUser } = require("../services/auth")
const path = require("path")

async function getAllUserBoughtOrCart(items) {

    var itemByType = {
        laptop: [],
        desktop: [],
        accessory: []
    };

    items.forEach(item => {
        if(item.itemType == "laptop"){
            itemByType.laptop.push((item.id))
        }else if(item.itemType == "desktop"){
            itemByType.desktop.push((item.id))
        }else if(item.itemType == "accessory"){
            itemByType.accessory.push((item.id))
        }
    });

    const laptops = await Laptop.find({_id: {$in: itemByType.laptop}});
    const desktops = await Desktop.find({_id: {$in: itemByType.desktop}});
    const accessories = await Accessory.find({_id: {$in: itemByType.accessory}});

    var result = [...laptops, ...desktops, ...accessories];

    return result;
}

async function loginUser(req, res) {
    const body = req.body;
    if (!body || !body.email || !body.password) {
        return res.status(400);
    }
    const userRecord = await User.findOne({
        email: body.email
    });

    if (!userRecord) {
        return res.render("account", {
            type: "login",
            msg: "Email or Password is Wrong",
        })
    }

    const hashedPassword = crypto.createHmac("sha256", userRecord.salt).update(body.password).digest("hex");

    if (hashedPassword != userRecord.password) {
        return res.render("account", {
            type: "login",
            msg: "Email or Password is Wrong"
        })
    }

    const token = setUser(userRecord);

    res.cookie("uid", token);
    return res.render("account", {
        user: userRecord,
        type: "user",
        item2: userRecord.itemsInCart,
        item: userRecord.itemsBought,
        msg: "Login is Successful"
    });
}

async function addUser(req, res) {
    const body = req.body;
    if (!body || !body.userName || !body.email || !body.password || !body.contact || !body.address) {
        return res.status(400);
    }
    const result = await User.create({
        userName: body.userName,
        email: body.email,
        password: body.password,
        contact: body.contact,
        address: body.address,
        role: "NORMAL",
        itemsBought: [],
        itemsInCart: []
    })

    const ans = await getAllUserBoughtOrCart(result.itemsBought);
    const ans2 = await getAllUserBoughtOrCart(result.itemsInCart);
    
    const token = setUser(result);

    res.cookie("uid", token);

    return res.status(201).render("account", {
        user: body,
        item: ans,
        item2: ans2
    })
}


async function openPage(req, res, path, parse) {
    const laptop = await Laptop.find();
    const desktop = await Desktop.find();
    const accessories = await Accessory.find();
    res.render(path, {
        list: [{
            item: laptop,
            type: "laptop"
        }, {
            item: desktop,
            type: "desktop"
        }, {
            item: accessories,
            type: "accessory"
        }]
    });
}


async function getItemDetails(req, res) {
    const type = req.query.type;
    var result;
    switch (type) {
        case "laptop":
            result = await Laptop.find();
            break;
        case "desktop":
            result = await Desktop.find();
            break;
        case "accessory":
            result = await Accessory.find();
            break;
        default:
            break;
    }
    res.json(result);
}

function getExtension(file){
    const seperated = file.split(".");

    return seperated[seperated.length - 1];
}

async function addItemInDB(req, res) {
    const body = req.body;
    const type = req.body.type;
    const file = req.file;

    var result;
    if (
        !body || !body.productName || !body.category || !body.qty || !body.price || !file) {
        if ((type in ["laptop", "desktop"]) && !body.processor || !body.ram || !body.storage || !body.battery || !body.graphicCard) {
            return res.json({ msg: "Fail" });
        }
        else if ((type === "accessory") && !body.description) {
            return res.json({ msg: "Fail" });
        }
    }

    const imageBuffer = await fs.promises.readFile(file.path);

    const image = await Image.create({
        name: `${type}_${body.productName}`,
        contentType: `image/${getExtension(file.path)}`,
        image: imageBuffer
    })


    const nonTechInfo = {
        productName: body.productName,
        category: body.category,
        qty: body.qty,
        price: body.price,
        image: image._id
    }

    switch (type) {
        case "laptop":
            result = await Laptop.create({
                ...nonTechInfo,
                specification: {
                    processor: body.processor,
                    ram: body.ram,
                    storage: body.storage,
                    battery: body.battery,
                    graphicCard: body.graphicCard
                }
            })
            break;
        case "desktop":
            result = await Desktop.create({
                ...nonTechInfo,
                specification: {
                    processor: body.processor,
                    ram: body.ram,
                    storage: body.storage,
                    battery: body.battery,
                    graphicCard: body.graphicCard
                }
            })
            break;
        case "accessory":
            result = await Accessory.create({
                ...nonTechInfo,
                description: body.description
            })
            break;
        default:
            break;
    }

    return res.redirect("/adm/addItem");
}

module.exports = {
    addUser,
    openPage,
    getItemDetails,
    addItemInDB,
    loginUser,
    getAllUserBoughtOrCart
}