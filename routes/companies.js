const express = require("express");
const router = new express.Router();
const ExpressError = require("../helpers/expressError");
const Company = require("../models/companies");
const jsonschema = require("jsonschema");
const companySchema = require("../schemas/companySchema.json");
const companyUpdateSchema = require("../schemas/companyUpdateSchema.json");

router.get("/", async (req, res, next) => {
    try {
        companies = await Company.getAllCompanies(req.query);
        return res.json({ companies });
    } catch(e) {
        next(e);
    }  
});

router.post("/", async (req, res, next) => {
    try {
        const result = jsonschema.validate(req.body, companySchema);
        if (!result.valid) {
            const listOfErrors = result.errors.map(e => e.stack);
            const error = new ExpressError(listOfErrors, 400);
            return next(error);
        }
        const company = await Company.addCompany(req.body.company);
        return res.status(201).json({ company });
    } catch(e) {
        next(e);
    }
});

router.get("/:handle", async (req, res, next) => {
    try {
        const company = await Company.getCompany(req.params.handle);
        return res.json({ company })
    } catch(e) {
        return next(e);
    }
});

router.patch("/:handle", async (req, res, next) => {
    try {
        if ('handle' in req.body) {
            throw new ExpressError('You are not allowed to change the handle.', 400);
        }
        const result = jsonschema.validate(req.body, companyUpdateSchema);
        if (!result.valid) {
            const listOfErrors = result.errors.map(e => e.stack);
            const error = new ExpressError(listOfErrors, 400);
            return next(error);
        }
        const company = await Company.update(req.params.handle, req.body);
        return res.json({ company })
    } catch(e) {
        return next(e);
    }
});

router.delete("/:handle", async (req, res, next) => {
    try {
        await Company.remove(req.params.handle);
        return res.json({ message : "Company deleted" })
    } catch(e) {
        return next(e);
    }
});

module.exports = router;