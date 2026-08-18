const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        uid: {
            type: String,
            required: true,
            unique: true
        },

        email: {
            type: String,
            trim: true,
            lowercase: true
        },

        displayName: {
            type: String,
            trim: true
        },

        photoURL: {
            type: String
        },

        provider: {
            type: String,
            default: "google"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
