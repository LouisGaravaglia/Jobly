const db = require("../db");
const ExpressError = require("../helpers/expressError");

class Company {

    static async getAllCompanies(query) {
        const { search, min_employees, max_employees } = query;
        let baseQuery = `SELECT handle, name FROM companies`;
        const whereExpressions = [];
        const queryValues = [];

        if (+min_employees >= +max_employees) {
            throw new ExpressError("Min Employees must be less than Max Employees", 400);
        }

        if (min_employees) {
            queryValues.push(+min_employees);
            whereExpressions.push(`num_employees >= $${queryValues.length}`);
        }

        if (max_employees) {
            queryValues.push(+max_employees);
            whereExpressions.push(`num_employees <= $${queryValues.length}`);
        }

        if (search) {
            queryValues.push(`%${search}%`);
            whereExpressions.push(`name ILIKE $${queryValues.length}`)
        }

        if (whereExpressions.length >= 0) {
            baseQuery += " WHERE ";
        }

        const finalQuery = baseQuery + whereExpressions.join(" AND ") + " ORDER by name";
        console.log(finalQuery);
        const results = await db.query(finalQuery, queryValues);
        return results.rows
    }

    static async addCompany(data){
        const duplicateCompany = await db.query(`SELECT * FROM companies WHERE handle = $1`, [data.handle])

        if (duplicateCompany.rows[0]) {
            throw new ExpressError("There is already a company with that handle", 400);
        }

        const company = await db.query(`INSERT INTO companies (name, handle, num_employees, description, logo_url) 
                                        VALUES ($1, $2, $3, $4, $5)
                                        RETURNING *`, 
                                        [data.name, data.handle, data.num_employees, data.description, data.logo_url]);
        return company.rows;
    }


    static async getCompany(data){
        const company = await db.query(`SELECT * FROM companies WHERE handle = $1`, [data]);
        if (!company.rows[0]) throw new ExpressError("No company exists with that handle", 400);
        return company.rows;
    }




}

module.exports = Company;

// / search. If the query string parameter is passed, a filtered list of handles and names should be displayed based on the search term and if the name includes it.
// min_employees. If the query string parameter is passed, titles and company handles should be displayed that have a number of employees greater than the value of the query string parameter.
// max_employees. If the query string parameter is passed, a list of titles and company handles should be displayed that have a number of employees less than the value of the query string parameter.
// If the min_employees parameter is greater than the max_employees parameter, respond with a 400 status and a message notifying that the parameters are incorrect.