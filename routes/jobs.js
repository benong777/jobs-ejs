const express = require('express');
const router = express.Router();

const {
  getAllJobs,
  createJob,
  updateJob,
  deleteJob,
  showAddForm,
  showEditForm,
} = require('../controllers/jobs');

router.route('/').post(createJob).get(getAllJobs);
router.route('/:id').delete(deleteJob)
router.route('/new').get(showAddForm);
router.route('/edit/:id').get(showEditForm);
router.route('/update/:id').post(updateJob);
router.route('/delete/:id').post(deleteJob);

module.exports = router;