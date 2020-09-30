const db = require("../db");
const ExpressError = require("../helpers/expressError");
const sqlForPartialUpdate = require("../helpers/partialUpdate")

class Company {

    static async getAllCompanies(query) {
        const { search, min_employees, max_employees } = query;
        let baseQuery = `SELECT handle, name FROM companies`;
        const whereExpressions = [];
        const queryValues = [];
        if (!search && !min_employees && !max_employees) {
            const companies = await db.query(`SELECT * FROM companies`);
            return companies.rows;
          }
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
    };

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
    };

    static async getCompany(handle){
        const results = await db.query(`SELECT * FROM companies WHERE handle = $1`, [handle]);
        const company = results.rows[0];
        if (!company) throw new ExpressError("No company exists with that handle", 400);
        const jobs = await db.query(
            `SELECT id, title, salary, equity
                  FROM jobs 
                  WHERE company_handle = $1`,
            [handle]
          );
          company.jobs = jobs.rows;
        return company;
    };

    static async update(handle, data) {
        let { query, values } = sqlForPartialUpdate(
          "companies",
          data,
          "handle",
          handle
        );
        const result = await db.query(query, values);
        const company = result.rows[0];
        if (!company) {
          throw new ExpressError(`There exists no company '${handle}`, 404);
        }
        return company;
    };

    static async remove(handle){
        const deleteCompany = await db.query(`DELETE FROM companies WHERE handle = $1 RETURNING *`, [handle])
        if (!deleteCompany.rows[0]) {
            throw new ExpressError(`No company exists with the handle ${handle}`, 400);
        }
    };

}

module.exports = Company;