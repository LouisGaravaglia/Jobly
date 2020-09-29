const express = require("express");
const router = new express.Router();
const ExpressError = require("../helpers/expressError");
const Job = require("../models/jobs");
const jsonschema = require("jsonschema");
const jobSchema = require("../schemas/jobSchema.json");
const jobUpdateSchema = require("../schemas/jobUpdateSchema.json");
const { route } = require("../app");







// POST /jobs
// This route creates a new job and returns a new job.
// It should return JSON of {job: jobData}
router.post("/", async (req, res, next) => {
    try{
        const results = jsonschema.validate(req.body, jobSchema);
        if(!results.valid) {
            const listOfErrors = results.errors.map(e => e.stack)
            const error = new ExpressError (listOfErrors, 400);
            return next(error);
        }
        const newJob = await Job.create(req.body);
        return res.json({ newJob });
    } catch(e) {

    }

})

// GET /jobs
// This route should list all the titles and company handles for all jobs, ordered by the most recently posted jobs. It should also allow for the following query string parameters
// search: If the query string parameter is passed, a filtered list of titles and company handles should be displayed based on the search term and if the job title includes it.
// min_salary: If the query string parameter is passed, titles and company handles should be displayed that have a salary greater than the value of the query string parameter.
// min_equity: If the query string parameter is passed, a list of titles and company handles should be displayed that have an equity greater than the value of the query string parameter.
// It should return JSON of {jobs: [job, ...]}
router.get("/", async (req, res, next) => {
    try{
        const jobs = await Job.findAll(req.query);
        return res.json({ jobs });
    } catch(e) {
        return next(e);
    }

})

// GET /jobs/[id]
// This route should show information about a specific job including a key of company which is an object that contains all of the information about the company associated with it.
// It should return JSON of {job: jobData}
router.get("/:id", async (req, res, next) => {
    try {
        const job = await Job.findOne(req.params.id);
        return res.json({ job });
    } catch(e) {
        next(e);
    }
})

// PATCH /jobs/[id]
// This route updates a job by its ID and returns an the newly updated job.
// It should return JSON of {job: jobData}

// DELETE /jobs/[id]
// This route deletes a job and returns a message.

// It should return JSON of { message: "Job deleted" }

module.exports = router;