const erpnextService = require('../services/erpnextService');

const authMiddleware = {
    isAuthenticated: (req, res, next) => {
        if (req.session.user && req.session.sid) {
            erpnextService.setAuthToken(req.session.sid);
            next();
        } else {
            res.redirect('/login');
        }
    },

    setAPIHeaders: (req, res, next) => {
        if (req.session.sid) {
            erpnextService.setAuthToken(req.session.sid);
        }
        next();
    }
};

module.exports = authMiddleware;
