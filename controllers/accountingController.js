const accountingService = require('../services/accountingService');

class AccountingController {
    async listInvoices(req, res) {
        try {
            const invoices = await accountingService.getAllInvoices();
            res.render('accounting/index', { 
                invoices,
                user: req.session.user,
                active: 'accounting'
            });
        } catch (error) {
            console.error('Error in accounting controller:', error);
            res.render('accounting/index', { 
                error: 'Erreur lors de la récupération des factures',
                invoices: [],
                user: req.session.user,
                active: 'accounting'
            });
        }
    }

    async showInvoiceDetails(req, res) {
        try {
            const invoice = await accountingService.getInvoiceDetails(req.params.id);
            const paymentModes = await accountingService.getPaymentModes();
            
            if (!invoice) {
                return res.redirect('/accounting');
            }

            res.render('accounting/invoice-details', { 
                invoice,
                paymentModes,
                user: req.session.user,
                active: 'accounting'
            });
        } catch (error) {
            console.error('Error getting invoice details:', error);
            res.redirect('/accounting');
        }
    }

    async makePayment(req, res) {
        try {
            const { invoiceId, amount, paymentDate, paymentMode } = req.body;
            
            if (!invoiceId || !amount || !paymentDate || !paymentMode) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Tous les champs sont requis' 
                });
            }

            const success = await accountingService.makePayment(
                invoiceId,
                parseFloat(amount),
                paymentDate,
                paymentMode
            );

            if (success) {
                res.json({ 
                    success: true, 
                    message: 'Paiement effectué avec succès' 
                });
            } else {
                res.status(500).json({ 
                    success: false, 
                    message: 'Erreur lors du paiement' 
                });
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Erreur lors du traitement du paiement' 
            });
        }
    }
}

module.exports = new AccountingController();
