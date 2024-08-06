const express = require("express");
const {
    Laptop,
    Desktop,
    Accessory
} = require("../models/STOCK")
const User = require("../models/USER");

const {
    getItemDetails,
    addItemInDB,
} = require("../controller/controllers")

const { getUser } = require("../services/auth")

const router = express.Router();

router.get("/userRecord", async (req, res) => {
    const allUsers = await User.find();
    res.json(allUsers);
})

router.route("/")
    .get(async (req, res) => {
        const product = req.query.item;
        const podType = req.query.type;
        var productDetails;
        if (podType == "laptop") {
            productDetails = await Laptop.findById(product);
        } else if (podType == "desktop") {
            productDetails = await Desktop.findById(product);
        } else if (podType == "accessory") {
            productDetails = await Accessory.findById(product);
        }
        const userUid = req.cookies.uid;
        const user = getUser(userUid);

        res.render("buy", {
            id: productDetails._id,
            type: podType,
            name: productDetails.productName,
            qty: productDetails.qty,
            price: productDetails.price,
            image: productDetails.image,
            address: user.address,
            contact: user.contact,
        });
    })
    .post(async (req, res) => {
        const quantity = Number(req.body.quantity);
        const product = req.query.item;
        const podType = req.query.type;
        const userUid = req.cookies?.uid;
        var productDetails;

        const user = getUser(userUid);

        if(!quantity || !product || !podType) return res.status(400);

        if (podType == "laptop") {
            await Laptop.updateOne({_id: product}, {$inc: {qty: -quantity}});
            productDetails = await Laptop.findById(product)
        } else if (podType == "desktop") {
            await Desktop.updateOne({_id: product}, {$inc: {qty: -quantity}});
            productDetails = await Desktop.findById(product)
        } else if (podType == "accessory") {
            await Accessory.updateOne({_id: product}, {$inc: {qty: -quantity}});
            productDetails = await Accessory.findById(product)
        }


        await User.updateOne({email: user.email}, {$push: {itemsBought: {
            id: product, 
            itemType: podType,
            qty: quantity,
            name: productDetails.productName,
            image: productDetails.image,
            price: productDetails.price
        }}})
        res.redirect("/store")
    })

router.get("/addToCart", async (req, res)=>{
    const product = req.query.item;
    const podType = req.query.type;
    if (podType == "laptop") {
        productDetails = await Laptop.findById(product);
    } else if (podType == "desktop") {
        productDetails = await Desktop.findById(product);
    } else if (podType == "accessory") {
        productDetails = await Accessory.findById(product);
    }
    const userUid = req.cookies.uid;
    const user = getUser(userUid);

    await User.updateOne({email: user.email}, {$push: {itemsInCart: {
        id: product, 
        itemType: podType,
        qty: 1
    }}})

    res.redirect("/store");
})


module.exports = router;