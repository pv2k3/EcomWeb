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

    if(!userUid) return res.redirect("/account/login")

    const user = getUser(userUid);

    if(!user || !(user.role=="ADMIN")) return res.redirect("/account")
    req.user = user;
    next();
}

module.exports = {
    restrictToUserLogin,
    restrictToUserAdmin
}