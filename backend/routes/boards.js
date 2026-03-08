const express = require('express');
const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/boards - get all boards for current user
router.get('/', auth, async (req, res) => {
    try {
        const boards = await Board.find({
            $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
        }).populate('owner', 'name email avatarColor initials')
            .populate('members.user', 'name email avatarColor initials')
            .sort({ createdAt: -1 });
        res.json(boards);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/boards - create board
router.post('/', auth, async (req, res) => {
    try {
        const { title, background, backgroundType } = req.body;
        if (!title) return res.status(400).json({ message: 'Title required' });
        const board = new Board({
            title, background: background || '#0079BF',
            backgroundType: backgroundType || 'color',
            owner: req.user._id,
            members: [{ user: req.user._id, role: 'owner' }]
        });
        await board.save();
        await board.populate('owner', 'name email avatarColor initials');
        res.status(201).json(board);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/boards/:id - get single board with lists and cards
router.get('/:id', auth, async (req, res) => {
    try {
        const board = await Board.findById(req.params.id)
            .populate('owner', 'name email avatarColor initials')
            .populate('members.user', 'name email avatarColor initials');
        if (!board) return res.status(404).json({ message: 'Board not found' });

        const isMember = board.owner._id.toString() === req.user._id.toString() ||
            board.members.some(m => m.user._id.toString() === req.user._id.toString());
        if (!isMember) return res.status(403).json({ message: 'Access denied' });

        const lists = await List.find({ board: board._id, isArchived: false }).sort('position');
        const cards = await Card.find({ board: board._id, isArchived: false })
            .populate('members', 'name email avatarColor initials')
            .sort('position');

        res.json({ board, lists, cards });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/boards/:id - update board
router.put('/:id', auth, async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);
        if (!board) return res.status(404).json({ message: 'Board not found' });
        if (board.owner.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Not authorized' });

        const { title, background, backgroundType, isStarred, labels } = req.body;
        if (title !== undefined) board.title = title;
        if (background !== undefined) board.background = background;
        if (backgroundType !== undefined) board.backgroundType = backgroundType;
        if (isStarred !== undefined) board.isStarred = isStarred;
        if (labels !== undefined) board.labels = labels;
        await board.save();
        res.json(board);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/boards/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);
        if (!board) return res.status(404).json({ message: 'Board not found' });
        if (board.owner.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Not authorized' });

        await List.deleteMany({ board: board._id });
        await Card.deleteMany({ board: board._id });
        await board.deleteOne();
        res.json({ message: 'Board deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
