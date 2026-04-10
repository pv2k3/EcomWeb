const express = require("express");
const {
    Laptop,
    Desktop,
    Accessory
} = require("../models/STOCK")
const User = require("../models/USER");
const { getUser } = require("../services/auth");

const router = express.Router();

async function getProduct(podType, productId) {
    if (podType === "laptop") return Laptop.findById(productId);
    if (podType === "desktop") return Desktop.findById(productId);
    if (podType === "accessory") return Accessory.findById(productId);
    return null;
}

router.route("/")
    .get(async (req, res) => {
        const product = req.query.item;
        const podType = req.query.type;
        const productDetails = await getProduct(podType, product);
        if (!productDetails) return res.redirect("/store");

        const user = getUser(req.cookies.uid);
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
        const user = getUser(req.cookies?.uid);

        if (!quantity || !product || !podType || !user) return res.status(400).send("Bad Request");

        const productDetails = await getProduct(podType, product);
        if (!productDetails) return res.status(404).send("Product not found");

        if (productDetails.qty < quantity) {
            return res.status(400).send("Insufficient stock");
        }

        if (podType === "laptop") await Laptop.updateOne({ _id: product }, { $inc: { qty: -quantity } });
        else if (podType === "desktop") await Desktop.updateOne({ _id: product }, { $inc: { qty: -quantity } });
        else if (podType === "accessory") await Accessory.updateOne({ _id: product }, { $inc: { qty: -quantity } });

        await User.updateOne({ email: user.email }, {
            $push: {
                itemsBought: {
                    id: product,
                    itemType: podType,
                    qty: quantity,
                    name: productDetails.productName,
                    image: productDetails.image,
                    price: productDetails.price
                }
            }
        });
        res.redirect("/store");
    });

router.get("/addToCart", async (req, res) => {
    const product = req.query.item;
    const podType = req.query.type;
    const user = getUser(req.cookies.uid);
    if (!user) return res.redirect("/account/login");

    const productDetails = await getProduct(podType, product);
    if (!productDetails) return res.redirect("/store");

    await User.updateOne({ email: user.email }, {
        $push: {
            itemsInCart: {
                id: product,
                itemType: podType,
                qty: 1,
                name: productDetails.productName,
                image: productDetails.image,
                price: productDetails.price
            }
        }
    });
    res.redirect("/store");
});

module.exports = router;
