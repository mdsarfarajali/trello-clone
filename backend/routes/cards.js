const express = require('express');
const Card = require('../models/Card');
const List = require('../models/List');
const Board = require('../models/Board');
const auth = require('../middleware/auth');
const router = express.Router();

// Helper: check if user is a member of the board
async function checkBoardAccess(boardId, userId) {
    const board = await Board.findById(boardId);
    if (!board) return false;
    return board.owner.toString() === userId.toString() ||
        board.members.some(m => m.user.toString() === userId.toString());
}

// POST /api/cards - create card
router.post('/', auth, async (req, res) => {
    try {
        const { title, listId, boardId } = req.body;
        if (!title || !listId || !boardId) return res.status(400).json({ message: 'Required fields missing' });

        const hasAccess = await checkBoardAccess(boardId, req.user._id);
        if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

        const count = await Card.countDocuments({ list: listId, isArchived: false });
        const card = new Card({ title, list: listId, board: boardId, position: count * 1000 });
        await card.save();
        await card.populate('members', 'name email avatarColor initials');
        res.status(201).json(card);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/cards/:id - get single card with full details
router.get('/:id', auth, async (req, res) => {
    try {
        const card = await Card.findById(req.params.id)
            .populate('members', 'name email avatarColor initials')
            .populate('comments.author', 'name email avatarColor initials');
        if (!card) return res.status(404).json({ message: 'Card not found' });

        const hasAccess = await checkBoardAccess(card.board, req.user._id);
        if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

        res.json(card);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/cards/:id - update card (title, description, dueDate, labels, cover, etc.)
router.put('/:id', auth, async (req, res) => {
    try {
        const card = await Card.findById(req.params.id);
        if (!card) return res.status(404).json({ message: 'Card not found' });

        const hasAccess = await checkBoardAccess(card.board, req.user._id);
        if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

        const fields = ['title', 'description', 'dueDate', 'dueDateCompleted', 'labelColors', 'cover', 'position', 'list', 'checklists'];
        fields.forEach(f => { if (req.body[f] !== undefined) card[f] = req.body[f]; });

        await card.save();
        await card.populate('members', 'name email avatarColor initials');
        await card.populate('comments.author', 'name email avatarColor initials');
        res.json(card);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/cards/move - move card between lists
router.post('/move', auth, async (req, res) => {
    try {
        const { cardId, sourceListId, destListId, newPosition, cardUpdates } = req.body;
        const card = await Card.findById(cardId);
        if (!card) return res.status(404).json({ message: 'Card not found' });

        const hasAccess = await checkBoardAccess(card.board, req.user._id);
        if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

        card.list = destListId;
        card.position = newPosition;
        await card.save();

        // Bulk update positions for all cards provided
        if (cardUpdates && cardUpdates.length > 0) {
            await Promise.all(cardUpdates.map(c =>
                Card.findByIdAndUpdate(c._id, { position: c.position, list: c.list })
            ));
        }
        res.json({ message: 'Card moved' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/cards/:id/members - add member
router.post('/:id/members', auth, async (req, res) => {
    try {
        const { userId } = req.body;
        const card = await Card.findById(req.params.id);
        if (!card) return res.status(404).json({ message: 'Card not found' });

        const hasAccess = await checkBoardAccess(card.board, req.user._id);
        if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

        if (!card.members.includes(userId)) card.members.push(userId);
        await card.save();
        await card.populate('members', 'name email avatarColor initials');
        res.json(card);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/cards/:id/members/:userId
router.delete('/:id/members/:userId', auth, async (req, res) => {
    try {
        const card = await Card.findById(req.params.id);
        if (!card) return res.status(404).json({ message: 'Card not found' });

        const hasAccess = await checkBoardAccess(card.board, req.user._id);
        if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

        card.members = card.members.filter(m => m.toString() !== req.params.userId);
        await card.save();
        await card.populate('members', 'name email avatarColor initials');
        res.json(card);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/cards/:id/comments - add comment
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: 'Comment text required' });
        const card = await Card.findById(req.params.id);
        if (!card) return res.status(404).json({ message: 'Card not found' });

        const hasAccess = await checkBoardAccess(card.board, req.user._id);
        if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

        card.comments.push({ text, author: req.user._id });
        await card.save();
        await card.populate('members', 'name email avatarColor initials');
        await card.populate('comments.author', 'name email avatarColor initials');
        res.json(card);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/cards/:id/comments/:commentId
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
    try {
        const card = await Card.findById(req.params.id);
        if (!card) return res.status(404).json({ message: 'Card not found' });

        const hasAccess = await checkBoardAccess(card.board, req.user._id);
        if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

        card.comments = card.comments.filter(c => c._id.toString() !== req.params.commentId);
        await card.save();
        await card.populate('members', 'name email avatarColor initials');
        await card.populate('comments.author', 'name email avatarColor initials');
        res.json(card);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/cards/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const card = await Card.findById(req.params.id);
        if (!card) return res.status(404).json({ message: 'Card not found' });

        const hasAccess = await checkBoardAccess(card.board, req.user._id);
        if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

        await card.deleteOne();
        res.json({ message: 'Card deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
