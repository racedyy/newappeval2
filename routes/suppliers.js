const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

// Middleware d'authentification
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Routes des fournisseurs
router.get('/', isAuthenticated, supplierController.getSuppliers);
router.get('/:id', isAuthenticated, supplierController.getSupplierDetails);
router.put('/quotation/:quotationId/prices', isAuthenticated, supplierController.updateQuotationPrices);

module.exports = router;
