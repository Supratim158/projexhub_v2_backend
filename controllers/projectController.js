const Project = require('../models/projectModel');

module.exports = {
    createProject: async (req, res) => {
        const newProject = new Project({
            userId: req.user.id,
            ...req.body
        });

        try {
            const savedProject = await newProject.save();
            res.status(201).json(savedProject);
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },

    getAllProjects: async (req, res) => {
        try {
            const { status, userId } = req.query;
            let query = {};
            if (status && status !== 'all') {
                query.status = status;
            } else if (!status) {
                query.status = 'approved';
            }
            
            if (userId) {
                query.userId = userId;
            }

            const projects = await Project.find(query).populate('userId', 'userName email profile');
            res.status(200).json(projects);
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },

    getAllRejectedProjects: async (req, res) => {
        try {
            const { status, userId } = req.query;
            let query = {};
            if (status && status !== 'all') {
                query.status = status;
            } else if (!status) {
                query.status = 'rejected';
            }
            
            if (userId) {
                query.userId = userId;
            }

            const projects = await Project.find(query).populate('userId', 'userName email profile');
            res.status(200).json(projects);
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },

    getProjectById: async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('userId', 'userName email profile')
            .populate('comments.user', 'userName profile')
            .populate('comments.replies.user', 'userName profile');

        if (!project) {
            return res.status(404).json({
                status: false,
                message: "Project not found"
            });
        }

        // 🔥 Get current user id (from auth middleware)
        const userId = req.user?.id;

        // 🔥 Check if user liked the project
        let isLiked = false;

        if (userId) {
            isLiked = project.likes.some(
                (id) => id.toString() === userId
            );
        }

        // 🚀 Send response with isLiked
        res.status(200).json({
            status: true,
            project,
            isLiked, // 🔥 important fix
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
},

    getUserProjects: async (req, res) => {
        try {
            const { status } = req.query;
            let query = { userId: req.user.id };
            if (status && status !== 'all') {
                query.status = status;
            }

            const projects = await Project.find(query).populate('userId', 'userName email profile');
            res.status(200).json(projects);
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },

    getApprovedUserProjects: async (req, res) => {
    try {
        let query = {
            userId: req.user.id,
            status: 'approved' // 🔥 force only approved
        };

        const projects = await Project.find(query)
            .populate('userId', 'userName email profile');

        res.status(200).json({
            status: true,
            count: projects.length,
            data: projects
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
},

    updateProject: async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({
                status: false,
                message: "Project not found"
            });
        }

        // 🔒 Authorization check
        if (
            project.userId.toString() !== req.user.id &&
            req.user.userType !== 'Admin'
        ) {
            return res.status(403).json({
                status: false,
                message: "You can update only your projects unless you are an Admin"
            });
        }

        // ✅ Force status to Pending
        const updatedProject = await Project.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    ...req.body,
                    status: "pending"   // 🔥 always reset
                }
            },
            { returnDocument: 'after' } // better than returnDocument
        );

        res.status(200).json(updatedProject);

    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
},

    deleteProject: async (req, res) => {
        try {
            const project = await Project.findById(req.params.id);
            if (!project) return res.status(404).json({ status: false, message: "Project not found" });
            
            if (project.userId.toString() !== req.user.id && req.user.userType !== 'Admin') {
                return res.status(403).json({ status: false, message: "You can delete only your projects" });
            }

            await Project.findByIdAndDelete(req.params.id);
            res.status(200).json({ status: true, message: "Project successfully deleted" });
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },

    updateProjectStatus: async (req, res) => {
        try {
            if (req.user.userType !== 'Admin') {
                return res.status(403).json({ status: false, message: "Only Admins can approve or reject projects" });
            }

            const { status } = req.body;
            if (!['pending', 'approved', 'rejected'].includes(status)) {
                return res.status(400).json({ status: false, message: "Invalid status value" });
            }

            const updatedProject = await Project.findByIdAndUpdate(
                req.params.id,
                { $set: { status } },
                { returnDocument: 'after' }
            );

            if (!updatedProject) {
                return res.status(404).json({ status: false, message: "Project not found" });
            }

            res.status(200).json(updatedProject);
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },

    // ================= ADMIN FUNCTIONS =================

// Get all pending projects (Admin)
    getPendingProjects: async (req, res) => {
    try {
        if (req.user.userType !== 'Admin') {
            return res.status(403).json({ status: false, message: "Only Admin can view pending projects" });
        }

        const projects = await Project.find({ status: "pending" })
            .populate('userId', 'userName email profile');

        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
},

// Approve project
approveProject: async (req, res) => {
    try {
        if (req.user.userType !== 'Admin') {
            return res.status(403).json({ status: false, message: "Only Admin can approve projects" });
        }

        const project = await Project.findByIdAndUpdate(
            req.params.id,
            { status: "approved" },
            { returnDocument: 'after' }
        );

        if (!project) {
            return res.status(404).json({ status: false, message: "Project not found" });
        }

        res.status(200).json({ status: true, message: "Project Approved", project });

    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
},

// Reject project
rejectProject: async (req, res) => {
    try {
        if (req.user.userType !== 'Admin') {
            return res.status(403).json({ status: false, message: "Only Admin can reject projects" });
        }

        const project = await Project.findByIdAndUpdate(
            req.params.id,
            { status: "rejected" },
            { returnDocument: 'after' }
        );

        if (!project) {
            return res.status(404).json({ status: false, message: "Project not found" });
        }

        res.status(200).json({ status: true, message: "Project Rejected", project });

    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
    },

// ❤️ LIKE / UNLIKE
toggleLike : async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    const userId = req.user.id;

    if (project.likes.includes(userId)) {
      project.likes = project.likes.filter(
        (id) => id.toString() !== userId
      );
    } else {
      project.likes.push(userId);
    }

    project.likeCount = project.likes.length;

    await project.save();

    res.json({
      likeCount: project.likeCount,
      liked: project.likes.includes(userId),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
},

// 💬 ADD COMMENT
addComment : async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    project.comments.unshift({
      user: req.user.id,
      text: req.body.text,
    });

    await project.save();

    const updated = await Project.findById(req.params.id)
      .populate("comments.user", "name profilePic");

    res.json(updated.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
},

// 💬 GET ALL COMMENTS (Optimized)
getAllComments: async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .select("comments") // 🔥 only comments (important optimization)
      .populate("comments.user", "userName profile")
      .populate("comments.replies.user", "userName profile");

    if (!project) {
      return res.status(404).json({
        status: false,
        message: "Project not found"
      });
    }

    res.status(200).json({
      status: true,
      count: project.comments.length,
      comments: project.comments
    });

  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message
    });
  }
},

// 💬➡️💬 REPLY
replyComment : async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    const comment = project.comments.id(req.params.commentId);

    comment.replies.push({
      user: req.user.id,
      text: req.body.text,
    });

    await project.save();

    const updated = await Project.findById(req.params.id)
      .populate("comments.user", "name profilePic")
      .populate("comments.replies.user", "name profilePic");

    res.json(updated.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
},

// 📥 GET PROJECT (with populated data)
getProjectComments : async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("user", "name profilePic")
      .populate("comments.user", "name profilePic")
      .populate("comments.replies.user", "name profilePic");

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
},

// 🔥 GET TOP PROJECTS BY CATEGORY (Highest Engagement)
getTopProjectsByCategory: async (req, res) => {
  try {
    const categories = ["AI", "ML", "IoT", "App", "Web", "Blockchain", "Others"];

    let result = {};

    for (let category of categories) {
      const projects = await Project.aggregate([
        {
          $match: {
            categories: category,
            status: "approved",
          },
        },
        {
          $addFields: {
            // ✅ total comments count
            commentCount: { $size: "$comments" },

            // 🔥 ADVANCED ENGAGEMENT SCORE
            engagementScore: {
              $add: [
                { $multiply: ["$likeCount", 2] }, // 👍 likes weight = 2
                { $size: "$comments" }, // 💬 comments
                {
                  $reduce: {
                    input: "$comments",
                    initialValue: 0,
                    in: {
                      $add: [
                        "$$value",
                        { $size: "$$this.replies" } // 🔁 replies count
                      ]
                    }
                  }
                }
              ]
            },
          },
        },
        {
          $sort: { engagementScore: -1 },
        },
        {
          $limit: 1,
        },
      ]);

      result[category] = projects;
    }

    res.status(200).json({
      status: true,
      data: result,
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
},
    
};
