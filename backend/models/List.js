const mongoose = require('mongoose');

const ListSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    position: { type: Number, required: true },
    isArchived: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('List', ListSchema);
