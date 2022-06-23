const passport = require("passport");
const OutlookStrategy = require("passport-outlook").Strategy;
const express = require("express");
const User = require("../models/userSchema");

const OUTLOOK_CLIENT_ID = process.env.OUTLOOK_CLIENT_ID;
const OUTLOOK_CLIENT_SECRET = process.env.OUTLOOK_CLIENT_SECRET;

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(
    new OutlookStrategy(
        {
            clientID: OUTLOOK_CLIENT_ID,
            clientSecret: OUTLOOK_CLIENT_SECRET,
            callbackURL: "http://localhost:5000/auth/outlook/callback",
            passReqToCallback: true,
        },
        function (req, accessToken, refreshToken, profile, done) {
            User.findOne({ outlookId: profile.id }).then((currentUser) => {
                if (currentUser) {
                    // user already exists
                    return done(null, currentUser);
                } else {
                    // create new user
                    const newUser = {
                        outlookId: profile.id,
                        name: profile._json.DisplayName,
                        email: profile._json.EmailAddress,
                        accessToken: accessToken,
                        isverified: true,
                    };

                    if (refreshToken) newUser.refreshToken = refreshToken;
                    if (profile.MailboxGuid)
                        newUser.mailboxGuid = profile.MailboxGuid;
                    if (profile.Alias) newUser.alias = profile.Alias;
                    new User(newUser).save().then((NewUser) => {
                        return done(null, NewUser);
                    });
                }
            });
        }
    )
);
