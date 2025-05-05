const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');

// Middleware d'authentification
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Liste des factures
router.get('/', isAuthenticated, accountingController.listInvoices);

// Détails d'une facture
router.get('/invoice/:id', isAuthenticated, accountingController.showInvoiceDetails);

// Version imprimable d'une facture
router.get('/invoice/:id/print', isAuthenticated, accountingController.printInvoice);

// API pour effectuer un paiement
router.post('/api/payment', isAuthenticated, accountingController.makePayment);

module.exports = router;
