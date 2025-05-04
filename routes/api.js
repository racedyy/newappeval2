const express = require('express');
const router = express.Router();
const erpnextService = require('../services/erpnextService');
const supplierService = require('../services/supplierService');

// Middleware d'authentification
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Non authentifié' });
    }
};

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

// Obtenir les articles d'un devis fournisseur
router.get('/quotation/:id/items', isAuthenticated, async (req, res) => {
    try {
        const quotation = await erpnextService.getDoc('Supplier Quotation', req.params.id);
        if (!quotation.success) {
            return res.status(404).json({ success: false, message: 'Devis non trouvé' });
        }
        res.json({ 
            success: true, 
            data: quotation.data.items.map(item => ({
                item_code: item.item_code,
                item_name: item.item_name,
                description: item.description,
                qty: item.qty,
                rate: item.rate,
                amount: item.amount
            }))
        });
    } catch (error) {
        console.error('Error getting quotation items:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des articles' });
    }
});

// Mettre à jour les prix d'un devis fournisseur
router.put('/quotation/:id/prices', isAuthenticated, async (req, res) => {
    try {
        const { items } = req.body;
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ success: false, message: 'Format de données invalide' });
        }

        const success = await supplierService.updateQuotationPrices(req.params.id, items);
        if (success) {
            res.json({ success: true, message: 'Prix mis à jour avec succès' });
        } else {
            res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour des prix' });
        }
    } catch (error) {
        console.error('Error updating quotation prices:', error);
        if (error.message.includes('après soumission')) {
            res.status(400).json({ success: false, message: 'Impossible de modifier les prix après soumission du devis' });
        } else {
            res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour des prix' });
        }
    }
});

module.exports = router;
