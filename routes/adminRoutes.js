const express = require("express");
const { getUser } = require("../services/auth");
const User = require("../models/USER");

const router = express.Router();

router.get("/", async (req, res)=>{
    const userUid = req.cookies.uid;

    const user = getUser(userUid);
    const name = await User.findById(user.id, {userName: 1, _id:0});

    res.render("admin", {
        name: name,
    })
})
.get("/addItem", (req, res) => {
    res.render("addStock")
})

module.exports = router;