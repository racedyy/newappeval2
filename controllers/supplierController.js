const supplierService = require('../services/supplierService');

const supplierController = {
    // Liste des fournisseurs
    getSuppliers: async (req, res) => {
        try {
            // Vérifier si l'utilisateur est connecté
            if (!req.session || !req.session.user) {
                return res.redirect('/login');
            }

            const status = req.query.status || '';
            const suppliers = await supplierService.getAllSuppliers(status);
            
            res.render('suppliers/index', {
                title: 'Fournisseurs - ERPNext Integration',
                user: req.session.user,
                suppliers,
                status,
                error: null
            });
        } catch (error) {
            console.error('Error in getSuppliers:', error);
            res.render('suppliers/index', {
                title: 'Fournisseurs - ERPNext Integration',
                user: req.session.user,
                suppliers: [],
                status: req.query.status || '',
                error: 'Erreur lors du chargement des fournisseurs'
            });
        }
    },

    // Détails d'un fournisseur
    getSupplierDetails: async (req, res) => {
        try {
            // Vérifier si l'utilisateur est connecté
            if (!req.session || !req.session.user) {
                return res.redirect('/login');
            }

            const supplierId = req.params.id;
            
            // Récupérer les données en parallèle
            const [supplier, quotations, orders] = await Promise.all([
                supplierService.getSupplierDetails(supplierId),
                supplierService.getSupplierQuotations(supplierId),
                supplierService.getSupplierOrders(supplierId)
            ]);

            if (!supplier) {
                return res.status(404).render('error', {
                    message: 'Fournisseur non trouvé',
                    error: { status: 404 }
                });
            }

            res.render('suppliers/details', {
                title: `${supplier.supplier_name} - ERPNext Integration`,
                user: req.session.user,
                supplier,
                quotations,
                orders,
                error: null
            });
        } catch (error) {
            console.error('Error in getSupplierDetails:', error);
            res.status(500).render('error', {
                message: 'Erreur lors du chargement des détails du fournisseur',
                error: { status: 500 }
            });
        }
    },

    // Mise à jour des prix d'une demande de devis
    updateQuotationPrices: async (req, res) => {
        try {
            // Vérifier si l'utilisateur est connecté
            if (!req.session || !req.session.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Non authentifié'
                });
            }

            const { quotationId } = req.params;
            const { items } = req.body;

            const success = await supplierService.updateQuotationPrices(quotationId, items);

            res.json({
                success,
                message: success ? 'Prix mis à jour avec succès' : 'Erreur lors de la mise à jour des prix'
            });
        } catch (error) {
            console.error('Error in updateQuotationPrices:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour des prix'
            });
        }
    }
};

module.exports = supplierController;
