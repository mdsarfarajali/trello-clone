const express = require('express');
const List = require('../models/List');
const Card = require('../models/Card');
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

// POST /api/lists - create list
router.post('/', auth, async (req, res) => {
    try {
        const { title, boardId } = req.body;
        if (!title || !boardId) return res.status(400).json({ message: 'Title and boardId required' });

        const hasAccess = await checkBoardAccess(boardId, req.user._id);
        if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

        const count = await List.countDocuments({ board: boardId, isArchived: false });
        const list = new List({ title, board: boardId, position: count * 1000 });
        await list.save();
        res.status(201).json(list);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/lists/:id
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, position } = req.body;
        const list = await List.findById(req.params.id);
        if (!list) return res.status(404).json({ message: 'List not found' });

        const hasAccess = await checkBoardAccess(list.board, req.user._id);
        if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

        if (title !== undefined) list.title = title;
        if (position !== undefined) list.position = position;
        await list.save();
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/lists/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const list = await List.findById(req.params.id);
        if (!list) return res.status(404).json({ message: 'List not found' });

        const hasAccess = await checkBoardAccess(list.board, req.user._id);
        if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

        await Card.deleteMany({ list: list._id });
        await list.deleteOne();
        res.json({ message: 'List deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/lists/reorder - reorder lists
router.post('/reorder', auth, async (req, res) => {
    try {
        const { lists } = req.body; // [{_id, position}]
        if (!lists || lists.length === 0) return res.status(400).json({ message: 'Lists required' });

        // Verify access to the board of the first list
        const firstList = await List.findById(lists[0]._id);
        if (firstList) {
            const hasAccess = await checkBoardAccess(firstList.board, req.user._id);
            if (!hasAccess) return res.status(403).json({ message: 'Access denied' });
        }

        await Promise.all(lists.map(l => List.findByIdAndUpdate(l._id, { position: l.position })));
        res.json({ message: 'Reordered' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
