const erpnextService = require('./erpnextService');

class SupplierService {
    async getAllSuppliers() {
        try {
            const result = await erpnextService.getList('Supplier', {
                fields: ['name', 'supplier_name', 'supplier_group', 'country', 'supplier_type'],
                filters: [['Supplier', 'disabled', '=', 0]],
                order_by: 'supplier_name asc'
            });
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error getting suppliers:', error);
            throw error;
        }
    }

    async getSupplierDetails(supplierId) {
        try {
            const result = await erpnextService.getDoc('Supplier', supplierId);
            return result.success ? result.data : null;
        } catch (error) {
            console.error('Error getting supplier details:', error);
            throw error;
        }
    }

    async getSupplierQuotations(supplierId) {
        try {
            const result = await erpnextService.getList('Supplier Quotation', {
                fields: [
                    'name',
                    'supplier',
                    'transaction_date',
                    'valid_till',
                    'grand_total',
                    'status',
                    'docstatus'
                ],
                filters: [
                    ['Supplier Quotation', 'supplier', '=', supplierId],
                    ['Supplier Quotation', 'docstatus', '<', 2]
                ],
                order_by: 'transaction_date desc'
            });
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error getting supplier quotations:', error);
            throw error;
        }
    }

    async getSupplierOrders(supplierId) {
        try {
            // Récupérer les commandes de base
            const result = await erpnextService.getList('Purchase Order', {
                fields: [
                    'name',
                    'supplier',
                    'transaction_date',
                    'grand_total',
                    'status',
                    'docstatus',
                    'per_received',
                    'per_billed'
                ],
                filters: [
                    ['Purchase Order', 'supplier', '=', supplierId],
                    ['Purchase Order', 'docstatus', '=', 1]
                ],
                order_by: 'transaction_date desc'
            });

            if (!result.success) {
                return [];
            }

            // Pour chaque commande, récupérer les détails complets
            const ordersWithDetails = await Promise.all(
                result.data.map(async (order) => {
                    try {
                        const details = await erpnextService.getDoc('Purchase Order', order.name);
                        if (details.success) {
                            // Utiliser per_billed comme approximation du paiement
                            // Si la commande est entièrement facturée, on considère qu'elle est payée
                            return {
                                ...order,
                                per_paid: order.per_billed
                            };
                        }
                        return order;
                    } catch (error) {
                        console.error(`Error getting details for order ${order.name}:`, error);
                        return {
                            ...order,
                            per_paid: 0
                        };
                    }
                })
            );

            return ordersWithDetails;
        } catch (error) {
            console.error('Error getting supplier orders:', error);
            throw error;
        }
    }

    async updateQuotationPrices(quotationId, items) {
        try {
            const quotation = await erpnextService.getDoc('Supplier Quotation', quotationId);
            if (!quotation.success) {
                throw new Error('Devis non trouvé');
            }

            // Vérifier si le devis est en brouillon
            if (quotation.data.docstatus !== 0) {
                throw new Error('Impossible de modifier les prix après soumission du devis');
            }

            // Mettre à jour les prix des articles
            const updatedItems = quotation.data.items.map(item => {
                const updatedItem = items.find(i => i.item_code === item.item_code);
                if (updatedItem) {
                    return {
                        ...item,
                        rate: updatedItem.rate
                    };
                }
                return item;
            });

            // Sauvegarder les modifications
            const result = await erpnextService.updateDoc('Supplier Quotation', quotationId, {
                items: updatedItems
            });

            return result.success;
        } catch (error) {
            console.error('Error updating quotation prices:', error);
            throw error;
        }
    }
}

module.exports = new SupplierService();
