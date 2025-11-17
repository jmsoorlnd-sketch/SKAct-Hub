import Project from "../models/ProjectModel";

//add project
const createProject = async (req, res) => {
  try {
    const proposer = req.user._id;
    const { title, description, startDate, endDate, budget, status } = req.body;

    const newProject = await Project.create({
      proposer,
      title,
      description,
      startDate,
      endDate,
      budget,
      status,
    });
    const savedProject = await newProject.save().then((project) => {
      return project.populate("proposer");
    });
    res.status(200).json(newProject);
  } catch (err) {
    res.status(500).json(err);
  }
};

//get project

const getProject = async (req, res) => {
  try {
    const projectId = req.params._id;
    const project = await Project.findOne(project);
    if (!project) {
      res.status(400).json("No Prject Found");
    }
  } catch {}
};

//get all project
