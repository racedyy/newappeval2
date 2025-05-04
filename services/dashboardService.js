const erpnextService = require('./erpnextService');

class DashboardService {
    async getDashboardData() {
        try {
            // Récupérer les statistiques en parallèle
            const [items, suppliers, purchaseOrders, stockValue] = await Promise.all([
                this.getItemsStats(),
                this.getSuppliersStats(),
                this.getPurchaseOrdersStats(),
                this.getStockValue()
            ]);

            // Récupérer les activités récentes
            const recentActivities = await this.getRecentActivities();

            return {
                stats: {
                    items,
                    suppliers,
                    purchaseOrders,
                    stockValue
                },
                recentActivities
            };
        } catch (error) {
            console.error('Error getting dashboard data:', error);
            throw error;
        }
    }

    async getItemsStats() {
        try {
            const result = await erpnextService.getList('Item', {
                fields: ['name']
            });
            return {
                total: result.success ? result.data.length : 0
            };
        } catch (error) {
            console.error('Error getting items stats:', error);
            return { total: 0 };
        }
    }

    async getSuppliersStats() {
        try {
            const result = await erpnextService.getList('Supplier', {
                fields: ['name'],
                filters: [[
                    'Supplier',
                    'disabled',
                    '=',
                    0
                ]]
            });
            return {
                total: result.success ? result.data.length : 0
            };
        } catch (error) {
            console.error('Error getting suppliers stats:', error);
            return { total: 0 };
        }
    }

    async getPurchaseOrdersStats() {
        try {
            const result = await erpnextService.getList('Purchase Order', {
                fields: ['name'],
                filters: [[
                    'Purchase Order',
                    'docstatus',
                    '=',
                    1
                ], [
                    'Purchase Order',
                    'status',
                    'not in',
                    ['Completed', 'Cancelled']
                ]]
            });
            return {
                total: result.success ? result.data.length : 0
            };
        } catch (error) {
            console.error('Error getting purchase orders stats:', error);
            return { total: 0 };
        }
    }

    async getStockValue() {
        try {
            const result = await erpnextService.getList('Stock Ledger Entry', {
                fields: ['sum(stock_value_difference) as total_value'],
                limit_page_length: 1
            });
            return {
                value: result.success && result.data[0] ? result.data[0].total_value || 0 : 0
            };
        } catch (error) {
            console.error('Error getting stock value:', error);
            return { value: 0 };
        }
    }

    async getRecentActivities() {
        try {
            const result = await erpnextService.getList('Activity Log', {
                fields: ['creation', 'reference_doctype', 'subject', 'status'],
                filters: [[
                    'Activity Log',
                    'reference_doctype',
                    'in',
                    ['Purchase Order', 'Purchase Receipt', 'Stock Entry']
                ]],
                order_by: 'creation desc',
                limit_page_length: 10
            });

            return result.success ? result.data.map(activity => ({
                date: activity.creation,
                type: activity.reference_doctype,
                description: activity.subject,
                status: activity.status || 'Info'
            })) : [];
        } catch (error) {
            console.error('Error getting recent activities:', error);
            return [];
        }
    }
}

module.exports = new DashboardService();
