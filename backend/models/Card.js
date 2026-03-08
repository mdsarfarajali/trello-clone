const mongoose = require('mongoose');

const ChecklistItemSchema = new mongoose.Schema({
    text: { type: String, required: true },
    completed: { type: Boolean, default: false }
});

const ChecklistSchema = new mongoose.Schema({
    title: { type: String, default: 'Checklist' },
    items: [ChecklistItemSchema]
});

const CommentSchema = new mongoose.Schema({
    text: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

const CardSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    list: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    position: { type: Number, required: true },
    labels: [{ type: mongoose.Schema.Types.ObjectId }], // refs to board label _ids
    labelColors: [{ type: String }], // stored colors for quick display
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dueDate: { type: Date, default: null },
    dueDateCompleted: { type: Boolean, default: false },
    checklists: [ChecklistSchema],
    comments: [CommentSchema],
    cover: { type: String, default: null },
    isArchived: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Card', CardSchema);
