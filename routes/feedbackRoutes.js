const router = require('express').Router();
const feedbackController = require('../controllers/feedbackControllers');
const { verifyTokenAndAuthorization, verifyAdmin } = require('../middleware/verifyToken');

// Send feedback
router.post('/send', verifyTokenAndAuthorization, feedbackController.createFeedback);

// Get all feedbacks
router.get('/all', verifyAdmin, feedbackController.getAllFeedbacks);

module.exports = router;