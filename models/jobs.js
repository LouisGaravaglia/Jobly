const db = require("../db");
const ExpressError = require("../helpers/expressError");
const sqlForPartialUpdate = require("../helpers/partialUpdate")

class Job {

    static async create(data) {
        const result = await db.query(
          `INSERT INTO jobs (title, salary, equity, company_handle) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, title, salary, equity, company_handle`,
          [data.title, data.salary, data.equity, data.company_handle]
        );
        return result.rows[0];
      }

    static async findAll(data) {
        const { search, min_salary, min_equity } = data;
        let baseQuery = `SELECT id, title, company_handle FROM jobs`;
        const queryValues = [];
        const whereExpressions = [];
        if (search) {
            queryValues.push(`%${search}%`);
            whereExpressions.push(`title ILIKE $${queryValues.length}`)
        }
        if (min_salary) {
          queryValues.push(+min_salary);
          whereExpressions.push(`salary >= $${queryValues.length}`)
        }
        if (min_equity) {
          queryValues.push(+min_equity);
          whereExpressions.push(`equity >= $${queryValues.length}`)
        }
        if (whereExpressions.length > 0) {
            baseQuery += " WHERE ";
        }
        const finalQuery = baseQuery + whereExpressions.join(" AND ") + " ORDER BY id";
        const jobs = await db.query(finalQuery, queryValues);
        return jobs.rows;
    };

    static async findOne(id) {
        const jobRes = await db.query(
            `SELECT id, title, salary, equity, company_handle 
              FROM jobs 
              WHERE id = $1`,
            [id]
        );
        const job = jobRes.rows[0];
        if (!job) {
          throw new ExpressError(`There exists no job '${id}'`, 404);
        }
        const companiesRes = await db.query(
          `SELECT name, num_employees, description, logo_url 
            FROM companies 
            WHERE handle = $1`,
          [job.company_handle]
        );
        job.company = companiesRes.rows[0];
        return job;
    };

    static async update(id, data) {
        let { query, values } = sqlForPartialUpdate("jobs", data, "id", id);
        const result = await db.query(query, values);
        const job = result.rows[0];
        if (!job) {
          throw new ExpressError(`There exists no job with the id of '${id}`, 404);
        }
        return job;
    }

    static async remove(id) {
        const result = await db.query(
            `DELETE FROM jobs 
              WHERE id = $1 
              RETURNING id`,
            [id]
        );
        if (result.rows.length === 0) {
            throw new ExpressError(`There exists no job '${id}`, 404);
        } 
    };

}

module.exports = Job;