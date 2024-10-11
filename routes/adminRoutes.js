const express = require("express");
const { getUser } = require("../services/auth");
const User = require("../models/USER");
const getAllRecords = require("../controller/helper");

const router = express.Router();

router.get("/", async (req, res)=>{
    const userUid = req.cookies.uid;

    const user = getUser(userUid);
    const name = await User.findById(user.id, {userName: 1, _id:0});

    const allUser = await (User.find({}, {itemsBought: 1, _id:0})); 

    const len = (allUser).length;

    var itemsSold = 0;
    var amountSales = 0;
    var totalOrders = 0;

    allUser.forEach(element => {
        const oneRecord = element.itemsBought;
        totalOrders += oneRecord.length;
        oneRecord.forEach(record => {
            itemsSold += record.qty;
            amountSales += (record.price * record.qty);
        });
    });

    const itemRecords = await getAllRecords();

    res.render("admin", {
        name: name,
        userCount: len,
        itemsSold: itemsSold,
        salesAmount: amountSales,
        totalOrders: totalOrders,
        allItems: itemRecords
    })
})
.get("/addItem", (req, res) => {
    res.render("addStock")
})

module.exports = router;