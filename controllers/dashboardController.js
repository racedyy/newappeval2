const dashboardService = require('../services/dashboardService');

const dashboardController = {
    getDashboard: async (req, res) => {
        try {
            // Vérifier si l'utilisateur est connecté
            if (!req.session || !req.session.user) {
                return res.redirect('/login');
            }

            // Récupérer les données du dashboard
            const dashboardData = await dashboardService.getDashboardData();

            // Formater les valeurs pour l'affichage
            const formattedData = {
                stats: {
                    items: {
                        total: dashboardData.stats.items.total,
                        label: 'Articles',
                        icon: 'bi-box'
                    },
                    suppliers: {
                        total: dashboardData.stats.suppliers.total,
                        label: 'Fournisseurs actifs',
                        icon: 'bi-people'
                    },
                    purchaseOrders: {
                        total: dashboardData.stats.purchaseOrders.total,
                        label: 'Commandes en cours',
                        icon: 'bi-cart'
                    },
                    stockValue: {
                        total: new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR'
                        }).format(dashboardData.stats.stockValue.value),
                        label: 'Valeur du stock',
                        icon: 'bi-graph-up'
                    }
                },
                recentActivities: dashboardData.recentActivities.map(activity => ({
                    ...activity,
                    date: new Intl.DateTimeFormat('fr-FR', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                    }).format(new Date(activity.date))
                }))
            };

            // Rendre la vue avec les données
            res.render('dashboard', {
                title: 'Tableau de bord - ERPNext Integration',
                user: req.session.user,
                data: formattedData
            });
        } catch (error) {
            console.error('Dashboard error:', error);
            res.render('dashboard', {
                title: 'Tableau de bord - ERPNext Integration',
                user: req.session.user,
                error: 'Erreur lors du chargement des données',
                data: {
                    stats: {
                        items: { total: 0, label: 'Articles', icon: 'bi-box' },
                        suppliers: { total: 0, label: 'Fournisseurs actifs', icon: 'bi-people' },
                        purchaseOrders: { total: 0, label: 'Commandes en cours', icon: 'bi-cart' },
                        stockValue: { total: '0 ARS', label: 'Valeur du stock', icon: 'bi-graph-up' }
                    },
                    recentActivities: []
                }
            });
        }
    }
};

module.exports = dashboardController;
