const express = require("express");
const router = new express.Router();
const ExpressError = require("../helpers/expressError");
const db = require("../db");
const Company = require("../models/companies");
const jsonschema = require("jsonschema");
const companySchema = require("../schemas/companySchema.json");



// GET /companies
// This should return the handle and name for all of the company objects. It should also allow for the following query string parameters:
// search. If the query string parameter is passed, a filtered list of handles and names should be displayed based on the search term and if the name includes it.
// min_employees. If the query string parameter is passed, titles and company handles should be displayed that have a number of employees greater than the value of the query string parameter.
// max_employees. If the query string parameter is passed, a list of titles and company handles should be displayed that have a number of employees less than the value of the query string parameter.
// If the min_employees parameter is greater than the max_employees parameter, respond with a 400 status and a message notifying that the parameters are incorrect.
// This should return JSON of {companies: [companyData, ...]}
router.get("/", async (req, res, next) => {
    try {
        companies = await Company.getAllCompanies(req.query);
        return res.json({ companies });
    } catch(e) {
        next(e);
    }  
})

// POST /companies
// This should create a new company and return the newly created company.
// This should return JSON of {company: companyData}
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
})

// GET /companies/[handle]
// This should return a single company found by its id.
// This should return JSON of {company: companyData}
router.get("/:handle", async (req, res, next) => {
    try {
        const company = await Company.getCompany(req.params.handle);
        return res.json({ company })
    } catch(e) {
        return next(e);
    }
})

// PATCH /companies/[handle]
// This should update an existing company and return the updated company.
// This should return JSON of {company: companyData}
router.get

// DELETE /companies/[handle]
// This should remove an existing company and return a message.
// This should return JSON of {message: "Company deleted"}




module.exports = router;