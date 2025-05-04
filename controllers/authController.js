const erpnextService = require('../services/erpnextService');

const authController = {
    getLogin: (req, res) => {
        console.log('GET /login - Session:', req.session);
        // If already logged in, redirect to dashboard
        if (req.session && req.session.user) {
            console.log('User already logged in, redirecting to dashboard');
            return res.redirect('/dashboard');
        }
        res.render('login', { error: null });
    },

    postLogin: async (req, res) => {
        console.log('POST /login - Attempting login');
        try {
            const { email, password } = req.body;
            console.log('Login attempt for email:', email);

            const result = await erpnextService.validateLogin(email, password);
            console.log('Login validation result:', {
                success: result.success,
                error: result.error
            });

            if (result.success) {
                // Store user info in session
                req.session.user = {
                    email: email,
                    name: result.user.full_name || email
                };
                console.log('Login successful, session created:', req.session.user);
                res.redirect('/dashboard');
            } else {
                console.log('Login failed:', result.error);
                res.render('login', { 
                    error: 'Invalid credentials',
                    email: email 
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            res.render('login', { 
                error: 'Login failed. Please try again.',
                email: req.body.email 
            });
        }
    },

    logout: (req, res) => {
        console.log('GET /logout - Destroying session');
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            res.redirect('/login');
        });
    }
};

module.exports = authController;
