const {getUser} = require("../services/auth");

function restrictToUserLogin(req, res, next) {
    const userUid = req.cookies?.uid;
    if(!userUid) return res.render("account", {
        type: "login"
    })

    const user = getUser(userUid);

    if(!user) return res.render("account", {
        type: "login"
    })
    req.user = user;
    next();
}

function restrictToUserAdmin(req, res, next) {
    const userUid = req.cookies.uid;
    const API_KEY = req.query.API_KEY;



    if(!userUid && !API_KEY) return res.redirect("/account/login")

    // const user = getUser(userUid);

    const user = (userUid)?getUser(userUid):getUser(API_KEY);

    if(!user || !(user.role=="ADMIN")) return res.redirect("/account")
    req.user = user;
    next();
}

module.exports = {
    restrictToUserLogin,
    restrictToUserAdmin
}