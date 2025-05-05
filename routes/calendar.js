const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');

// Middleware d'authentification
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Routes du calendrier
router.get('/', isAuthenticated, calendarController.showCalendar);
router.get('/events', isAuthenticated, calendarController.getEvents);

module.exports = router;
