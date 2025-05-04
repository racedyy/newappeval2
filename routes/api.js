const express = require('express');
const router = express.Router();
const erpnextService = require('../services/erpnextService');

// Get list of items
router.get('/items', async (req, res) => {
    const result = await erpnextService.getList('Item');
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

// Get single item
router.get('/items/:name', async (req, res) => {
    const result = await erpnextService.getDoc('Item', req.params.name);
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

// Create new item
router.post('/items', async (req, res) => {
    const result = await erpnextService.createDoc('Item', req.body);
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

// Update item
router.put('/items/:name', async (req, res) => {
    const result = await erpnextService.updateDoc('Item', req.params.name, req.body);
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

// Delete item
router.delete('/items/:name', async (req, res) => {
    const result = await erpnextService.deleteDoc('Item', req.params.name);
    if (result.success) {
        res.json({ message: 'Item deleted successfully' });
    } else {
        res.status(500).json({ error: result.error });
    }
});

module.exports = router;
