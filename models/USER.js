const mongoose = require("mongoose");
const crypto = require("node:crypto")

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    salt: {
        type: String,
    },
    contact: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true
    },
    itemsInCart: [{
        id: {
            type: String,
            required: true
        },
        itemType: {
            type: String,
            required: true
        },
        qty: {
            type: Number,
            required: true
        }
        ,
        name: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    role : {
        type: String, 
        default: "NORMAL"
    },
    itemsBought: [{
        id: {
            type: String,
            required: true
        },
        itemType: {
            type: String,
            required: true
        },
        qty: {
            type: Number,
            required: true
        }
        ,
        name: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    
}, { timestamps: true });

userSchema.pre("save", function(next){
    const user = this;
    if(!user.isModified("password")) return;

    const salt = crypto.randomBytes(16).toString();
    const hashedPassword = crypto.createHmac("sha256", salt).update(this.password).digest("hex");

    this.salt = salt;
    this.password = hashedPassword;

    next();
})

const User = mongoose.model("user", userSchema);

module.exports = User;