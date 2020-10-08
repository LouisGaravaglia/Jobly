const express = require("express");
const router = new express.Router();
const ExpressError = require("../helpers/expressError");
const Job = require("../models/jobs");
const jobSchema = require("../schemas/jobSchema.json");
const jobUpdateSchema = require("../schemas/jobUpdateSchema.json");
const { adminRequired, authRequired, validateSchema } = require('../middleware/auth');

router.post("/", adminRequired, async (req, res, next) => {
    try{
        validateSchema(jobSchema)
        const newJob = await Job.create(req.body);
        return res.json({ newJob });
    } catch(e) {
        next(e);
    }
});

router.get("/", authRequired, async (req, res, next) => {
    try{
        const jobs = await Job.findAll(req.query);
        return res.json({ jobs });
    } catch(e) {
        return next(e);
    }
});

router.get("/:id", authRequired, async (req, res, next) => {
    try {
        const job = await Job.findOne(req.params.id);
        return res.json({ job });
    } catch(e) {
        next(e);
    }
});

router.patch("/:id", adminRequired, async (req, res, next) => {
    try {
        if ('id' in req.body ) {
            throw new ExpressError('You are not allowed to change the ID', 400)
        }
        validateSchema(jobUpdateSchema)
        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
    } catch(e) {
        console.log(e);
        next(e);
    }
});

router.delete('/:id', adminRequired, async function(req, res, next) {
    try {
      await Job.remove(req.params.id);
      return res.json({ message: 'Job deleted' });
    } catch (err) {
      return next(err);
    }
  });

module.exports = router;