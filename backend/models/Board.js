const mongoose = require('mongoose');

const LabelSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    color: { type: String, required: true }
});

const BoardSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    background: { type: String, default: '#0079BF' },
    backgroundType: { type: String, enum: ['color', 'gradient', 'image'], default: 'color' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['owner', 'member'], default: 'member' }
    }],
    labels: {
        type: [LabelSchema], default: [
            { name: 'Green', color: '#61BD4F' },
            { name: 'Yellow', color: '#F2D600' },
            { name: 'Orange', color: '#FF9F1A' },
            { name: 'Red', color: '#EB5A46' },
            { name: 'Purple', color: '#C377E0' },
            { name: 'Blue', color: '#0079BF' }
        ]
    },
    isStarred: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Board', BoardSchema);
