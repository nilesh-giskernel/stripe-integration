const mongoose = require("mongoose")
const NewDATASchema = new mongoose.Schema({
    session: Object, 
  });
exports.NewDATA = mongoose.model('NewDATA', NewDATASchema);


const catSchema = new mongoose.Schema({
  session: Object, 
});

exports.Cats = mongoose.model('Cats', catSchema);