const mongoose = require('mongoose');
const familySchema = new mongoose.Schema({
    family_id: { type: String },
    members: [{type: mongoose.Types.ObjectId}]
}, { timestamps: true });
module.exports = mongoose.model("Family", familySchema);
