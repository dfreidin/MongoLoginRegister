const express = require("express");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
app.use(session({
    secret: "swordfish",
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: 60000}
}));
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
mongoose.connect("mongodb://localhost/login_reg_1");
var UserSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true,
        match: [/\A([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]+)\z/i, 'Please fill a valid email address']},
    first_name: {type: String, required: true},
    last_name: {type: String, required: true},
    password: {type: String, required: true},
    birthday: {type: Date, required: true}
});
mongoose.model("User", UserSchema);
var User = mongoose.model("User");
app.get("/", function(req, res){
    res.render("index");
});
app.get("/success", function(req, res){
    if(req.session.user_id) {
        User.findOne({_id: req.session.user_id}, function(err, user){
            if(err) {
                res.redirect("/");
            }
            else {
                res.render("show", {user: user});
            }
        });
    }
    else {
        res.redirect("/");
    }
});
app.post("/users", function(req, res){
    var user = new User();
    var user_fields = ["email", "first_name", "last_name", "birthday"];
    for(var i=0; i<user_fields.length; i++) {
        user[user_fields[i]] = req.body[user_fields[i]];
    }
    bcrypt.hash(req.body.password, 10, function(err, hash){
        if(err) {
            res.redirect("/");
        }
        else {
            user.password = hash;
            user.save(function(err){
                if(err) {
                    res.redirect("/");
                }
                else {
                    req.session.user_id = user._id;
                    res.redirect("/success");
                }
            });
        }
    });
});
app.post("/sessions", function(req, res){
    User.findOne({email: req.body.email}, function(err, user){
        if(err) {
            res.redirect("/");
        }
        else {
            console.log("found user with email " + user.email);
            bcrypt.compare(req.body.password, user.password, function(err, result){
                if(result) {
                    req.session.user_id = user._id;
                    res.redirect("/success");
                }
                else {
                    res.redirect("/");
                }
            });
        }
    });
});
app.listen(8000);