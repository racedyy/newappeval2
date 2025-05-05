const calendarService = require('../services/calendarService');

class CalendarController {
    async showCalendar(req, res) {
        try {
            res.render('calendar/index', {
                title: 'Calendrier - ERPNext Integration',
                user: req.session.user,
                active: 'calendar'
            });
        } catch (error) {
            console.error('Error in calendar controller:', error);
            res.render('calendar/index', {
                title: 'Calendrier - ERPNext Integration',
                user: req.session.user,
                active: 'calendar',
                error: 'Erreur lors du chargement du calendrier'
            });
        }
    }

    async getEvents(req, res) {
        try {
            const start = req.query.start;
            const end = req.query.end;
            const events = await calendarService.getEvents(start, end);
            res.json(events);
        } catch (error) {
            console.error('Error getting calendar events:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des événements' });
        }
    }
}

module.exports = new CalendarController();
