const express = require("express");
const router = new express.Router();
const ExpressError = require("../helpers/expressError");
const Company = require("../models/companies");
const companySchema = require("../schemas/companySchema.json");
const companyUpdateSchema = require("../schemas/companyUpdateSchema.json");
const { adminRequired, authRequired, validateSchema } = require('../middleware/auth');

router.get("/", authRequired, async (req, res, next) => {
    try {
        companies = await Company.getAllCompanies(req.query);
        return res.json({ companies });
    } catch(e) {
        next(e);
    }
});

router.post("/", adminRequired, async (req, res, next) => {
    try {
        validateSchema(companySchema)
        const company = await Company.addCompany(req.body.company);
        return res.status(201).json({ company });
    } catch(e) {
        next(e);
    }
});

router.get("/:handle", authRequired, async (req, res, next) => {
    try {
        const company = await Company.getCompany(req.params.handle);
        return res.json({ company })
    } catch(e) {
        return next(e);
    }
});

router.patch("/:handle", adminRequired, async (req, res, next) => {
    try {
        if ('handle' in req.body) {
            throw new ExpressError('You are not allowed to change the handle.', 400);
        }
        validateSchema(companyUpdateSchema)
        const company = await Company.update(req.params.handle, req.body);
        return res.json({ company })
    } catch(e) {
        return next(e);
    }
});

router.delete("/:handle", adminRequired, async (req, res, next) => {
    try {
        await Company.remove(req.params.handle);
        return res.json({ message : "Company deleted" })
    } catch(e) {
        return next(e);
    }
});

module.exports = router;