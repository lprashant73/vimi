const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    acno: {
        type: String
    },
    slno: {
        type: String
    },
    partno: {
        type: String
    },
    houseno: {
        type: String,
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    relation: {
        type: String
    },
    relativename: {
        type: String
    },
    epicno: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    age: {
        type: String,
        required: true
    },
    family: { type: mongoose.Types.ObjectId },

    image: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);

