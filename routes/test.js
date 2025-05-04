const express = require('express');
const router = express.Router();
const erpnextService = require('../services/erpnextService');

// Test route to verify API connection
router.get('/test-connection', async (req, res) => {
    try {
        // Try to get the list of users (a simple test)
        const result = await erpnextService.getList('User');
        if (result.success) {
            res.json({
                status: 'success',
                message: 'Successfully connected to ERPNext API',
                data: result.data
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Failed to connect to ERPNext API',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error testing connection',
            error: error.message
        });
    }
});

// Test route to verify API connection
router.get('/connection', async (req, res) => {
    try {
        console.log('Testing ERPNext connection...');
        const result = await erpnextService.testConnection();
        
        if (result.success) {
            res.json({
                status: 'success',
                message: 'Successfully connected to ERPNext API',
                data: result.data
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Failed to connect to ERPNext API',
                error: result.error,
                details: result.details
            });
        }
    } catch (error) {
        console.error('Connection test error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error testing connection',
            error: error.message
        });
    }
});

module.exports = router;
