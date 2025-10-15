const Job = require('../models/Job')

const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ createdBy: req.user._id });
    res.render("jobs", { jobs });
  } catch (err) {
    req.flash("error", "Unable to retrieve jobs.");
    res.redirect("/");
  }
}

const showAddForm = (req, res) => {
  res.render("job", { job: null });
};

const showEditForm = async(req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!job) {
      req.flash("error", "Job not found.");
      return res.redirect("/jobs");
    }
    res.render("job", { job });
  } catch (err) {
    req.flash("error", "Error finding job.");
    res.redirect("/jobs");
  }
};

const createJob = async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, createdBy: req.user._id });
    req.flash("info", "Job added.");
    res.redirect("/jobs");
  } catch (err) {
    req.flash("error", "Validation error.");
    res.redirect("/jobs/add");
  }
}

const updateJob = async (req, res) => {
  try {
    await Job.findOneAndUpdate({ _id: req.params.id, createdBy: req.user._id }, req.body);
    req.flash("info", "Job updated.");
    res.redirect("/jobs");
  } catch (err) {
    req.flash("error", "Update failed.");
    res.redirect(`/jobs/edit/${req.params.id}`);
  }
}

const deleteJob = async (req, res) => {
  const userId = req.user._id;
  const jobId = req.params.id;

  try {
    const job = await Job.findOneAndDelete({ _id: jobId, createdBy: userId });
    if (!job) {
      throw new NotFoundError(`No job with id ${jobId}`)
    }
    req.flash("info", "Job deleted.");
    res.redirect('/jobs');
  } catch (err) {
    req.flash("error", "Delete failed.");
    res.redirect("/jobs");
  }
}

module.exports = {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  showAddForm,
  showEditForm
}
