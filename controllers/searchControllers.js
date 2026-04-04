const Project = require("../models/projectModel");

const searchProjects = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({
        status: false,
        message: "Query is required"
      });
    }

    const projects = await Project.aggregate([
      {
        $search: {
          index: "default",
          compound: {
            should: [
              {
                text: {
                  query: query,
                  path: "title",
                  fuzzy: {}
                }
              },
              {
                text: {
                  query: query,
                  path: "description",
                  fuzzy: {}
                }
              },
              {
                text: {
                  query: query,
                  path: "memberNames", // 👥 array supported
                  fuzzy: {},
                  score: { boost: { value: 3 } }
                }
              }
            ]
          }
        }
      },

      // ✅ SELECT ONLY REQUIRED FIELDS
      {
        $project: {
          title: 1,
          description: 1,
          createdAt: 1,
          status: 1,

          // ✅ FIRST IMAGE ONLY
          image: { $arrayElemAt: ["$images", 0] },

          score: { $meta: "searchScore" }
        }
      },

      {
        $sort: { score: -1 }
      }
    ]);

    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message
    });
  }
};

module.exports = { searchProjects };