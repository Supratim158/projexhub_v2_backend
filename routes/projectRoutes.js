const router = require('express').Router();
const projectController = require('../controllers/projectController');
const searchController = require('../controllers/searchControllers');
const { verifyTokenAndAuthorization, verifyAdmin } = require('../middleware/verifyToken');

// Create a project
router.post('/', verifyTokenAndAuthorization, projectController.createProject);

// Get all projects
router.get('/', projectController.getAllProjects);

// 🔍 Search Projects
router.get("/search", verifyTokenAndAuthorization, searchController.searchProjects);

// Get all rejected projects
router.get('/rejected', projectController.getAllRejectedProjects);

// Get user specific projects
router.get('/user/me', verifyTokenAndAuthorization, projectController.getUserProjects);

// Get a project by ID
router.get('/:id',verifyTokenAndAuthorization, projectController.getProjectById);

router.get('/user/approved',verifyTokenAndAuthorization, projectController.getApprovedUserProjects);

// Update a project
router.put('/:id', verifyTokenAndAuthorization, projectController.updateProject);

// Update project status (Admin only)
router.put('/status/:id', verifyAdmin, projectController.updateProjectStatus);

router.post("/:id/like", verifyTokenAndAuthorization, projectController.toggleLike);

router.post("/:id/comment", verifyTokenAndAuthorization, projectController.addComment);

router.get("/:id/comment", verifyTokenAndAuthorization, projectController.getAllComments);

router.post("/:id/comment/:commentId/reply", verifyTokenAndAuthorization, projectController.replyComment);

// Delete a project
router.delete('/:id', verifyTokenAndAuthorization, projectController.deleteProject);

router.get('/top/categories', projectController.getTopProjectsByCategory);

// ================= ADMIN ROUTES =================

// Get all pending projects
router.get('/admin/pending', verifyAdmin, projectController.getPendingProjects);

// Approve project
router.put('/admin/approve/:id', verifyAdmin, projectController.approveProject);

// Reject project
router.put('/admin/reject/:id', verifyAdmin, projectController.rejectProject);



module.exports = router;
