const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { Laptop, Desktop, Accessory } = require("../models/STOCK");
const User = require("../models/USER");
const { getUser } = require("../services/auth");

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function getProduct(podType, productId) {
    if (podType === "laptop") return Laptop.findById(productId);
    if (podType === "desktop") return Desktop.findById(productId);
    if (podType === "accessory") return Accessory.findById(productId);
    return null;
}

// Show buy page
router.get("/", async (req, res) => {
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
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
});

// Create Razorpay order
router.post("/create-order", async (req, res) => {
    const { quantity, productId, productType } = req.body;
    const qty = Number(quantity);
    if (!qty || !productId || !productType) return res.status(400).json({ error: "Missing fields" });

    const productDetails = await getProduct(productType, productId);
    if (!productDetails) return res.status(404).json({ error: "Product not found" });
    if (productDetails.qty < qty) return res.status(400).json({ error: "Insufficient stock" });

    const amountPaise = productDetails.price * qty * 100; // Razorpay uses paise (INR * 100)
    const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: `order_${Date.now()}`,
    });

    res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
        productName: productDetails.productName,
    });
});

// Verify payment and record purchase
router.post("/verify", async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, productId, productType, quantity } = req.body;
    const qty = Number(quantity);
    const user = getUser(req.cookies?.uid);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !productId || !productType || !qty || !user) {
        return res.status(400).send("Invalid payment data");
    }

    // Verify HMAC signature
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        return res.status(400).send("Payment verification failed");
    }

    // Signature valid — record purchase
    const productDetails = await getProduct(productType, productId);
    if (!productDetails) return res.status(404).send("Product not found");

    if (productDetails.qty < qty) return res.status(400).send("Insufficient stock");

    if (productType === "laptop") await Laptop.updateOne({ _id: productId }, { $inc: { qty: -qty } });
    else if (productType === "desktop") await Desktop.updateOne({ _id: productId }, { $inc: { qty: -qty } });
    else if (productType === "accessory") await Accessory.updateOne({ _id: productId }, { $inc: { qty: -qty } });

    await User.updateOne({ email: user.email }, {
        $push: {
            itemsBought: {
                id: productId,
                itemType: productType,
                qty,
                name: productDetails.productName,
                image: productDetails.image,
                price: productDetails.price,
            }
        }
    });

    res.redirect("/buy/success");
});

// Add to cart
router.get("/addToCart", async (req, res) => {
    const product = req.query.item;
    const podType = req.query.type;
    const user = getUser(req.cookies.uid);
    if (!user) return res.redirect("/account/login");
    const productDetails = await getProduct(podType, product);
    if (!productDetails) return res.redirect("/store");
    await User.updateOne({ email: user.email }, {
        $push: { itemsInCart: { id: product, itemType: podType, qty: 1, name: productDetails.productName, image: productDetails.image, price: productDetails.price } }
    });
    res.redirect("/store");
});

// Success page
router.get("/success", (req, res) => {
    res.render("paymentSuccess");
});

module.exports = router;
