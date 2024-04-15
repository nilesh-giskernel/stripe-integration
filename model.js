const mongoose = require("mongoose")

exports.NewDATA = mongoose.model('NewDATA', { name: String });

exports.Cats = mongoose.model('Cats', { name: String });