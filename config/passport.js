const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
//const pool = require("../db/pool");
//const connection = require('./database');
//const User = connection.models.User;
//const validPassword = require("../lib/passwordUtils").validPassword;
const bcrypt = require("bcryptjs");
//import { prisma } from "../lib/prisma.js";
const prisma = require("../lib/prisma.js");

const customFields = {
  usernameField: "username",
  passwordField: "password",
};

const verifyCallback = async (username, password, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return done(null, false, { message: "Incorrect username" });
    }

    console.log("user");
    console.log(user);

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // passwords do not match!
      return done(null, false, { message: "Incorrect password" });
    }
    // Authentication successful
    return done(null, user);
  } catch (err) {
    return done(err);
  }
};

const strategy = new LocalStrategy(customFields, verifyCallback);

passport.use(strategy);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    //const user = rows[0];

    done(null, user);
  } catch (err) {
    done(err);
  }
});
