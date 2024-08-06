const express = require("express");

const {
    Accessory,
    Desktop,
    Laptop
} = require("../models/STOCK")
const User = require("../models/USER");

const {
    addUser,
    openPage,
    loginUser,
    getAllUserBoughtOrCart
} = require("../controller/controllers");
const { getUser } = require("../services/auth");


const staticRouter = express.Router();

staticRouter
    .get("/", (req, res) => {
        openPage(req, res, "home", "")
    })
    .get("/account", async (req, res) => {
        const userUid = req.cookies.uid;

        if (!userUid) {
            res.render("account", {
                type: "login"
            })
        }

        else {
            const userTokenData = getUser(userUid);
            const id = userTokenData.id;
            const userRecord = await User.findOne({
                _id: id,
            });

            const result2 = await getAllUserBoughtOrCart(userRecord.itemsInCart); 
            const result = await getAllUserBoughtOrCart(userRecord.itemsBought);

            res.render("account", {
                type: "none",
                user: userRecord,
                item: result,
                item2: result2
            })
        }
    })
    .get("/account/login", (req, res)=>{
        res.render("account", {
            type: "login"
        })
    })
    .post("/account/login", async (req, res) => {
        loginUser(req, res);
    })
    .get("/account/signup", (req, res) => {
        return res.render("account", {
            type: "signup"
        })
    })
    .post("/account/signup", (req, res) => {
        addUser(req, res);
    })
    .get("/store", (req, res) => {
        openPage(req, res, "store", "");
    })
    .get("/store/singleProduct", async (req, res) => {
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

        res.render("singleProduct", {
            type: podType,
            id: productDetails._id,
            name: productDetails.productName,
            category: productDetails.category,
            qty: productDetails.qty,
            price: productDetails.price,
            image: `.${productDetails.image}`,
            specification: productDetails.specification,
            description: productDetails.description
        });
    })
    .get("/addItem", (req, res) => {
        res.render("addStock")
    })
    .post("/logout", (req, res)=>{
        res.clearCookie("uid").redirect("/account")
    })

module.exports = staticRouter