process.env.NODE_ENV = "test";
const request = require('supertest');
const app = require('../../app');
const db = require("../../db");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');


testUser = {};

beforeEach(async function() {
    const hashedPassword = await bcrypt.hash('secret', 1);
    await db.query(
        `INSERT INTO users (username, password, first_name, last_name, email, is_admin)
                    VALUES ('testusername', $1, 'testfirstname', 'testlastname', 'test@email.com', true)`,
        [hashedPassword]
    );

    const response = await request(app)
        .post('/login')
        .send({
        username: 'testusername',
        password: 'secret'
    });

      testUser.userToken = response.body.token;
      testUser.currentUsername = jwt.decode(testUser.userToken).username;

    const result = await db.query(
        'INSERT INTO companies (handle, name, num_employees) VALUES ($1, $2, $3) RETURNING *',
        ['testcompany', 'testcompany inc', 1000]
    );

    testUser.currentCompany = result.rows[0];

    const newJob = await db.query(
        "INSERT INTO jobs (title, salary, equity, company_handle) VALUES ('Software Engineer', 100000, 0.05, $1) RETURNING *",
        [testUser.currentCompany.handle]
    );
    testUser.jobId = newJob.rows[0].id;
});

afterEach(async function() {
    try {
      await db.query('DELETE FROM jobs');
      await db.query('DELETE FROM users');
      await db.query('DELETE FROM companies');
    } catch (error) {
      console.error(error);
    }
});

afterAll(async function() {
    await db.end();
});

describe('GET /jobs', function() {

    test('Gets a list of all jobs', async function() {
        const response = await request(app).get('/jobs');
        const jobs = response.body.jobs;
        expect(response.statusCode).toBe(200);
        expect(jobs).toHaveLength(1);
        expect(jobs[0]).toHaveProperty('title');
    });

    test('Has working search', async function() {
        const response = await request(app).get('/jobs?search=software').send({ _token: testUser.userToken });
        const jobs = response.body.jobs;
        expect(response.statusCode).toBe(200);
        expect(jobs).toHaveLength(1);
        expect(jobs[0]).toHaveProperty('title');
    });

    test('Has working mix_salary filter', async function() {
        const response = await request(app).get('/jobs?min_salary=200000').send({ _token: testUser.userToken });
        const jobs = response.body.jobs
        expect(response.statusCode).toBe(200);
        expect(jobs).toHaveLength(0);
    });

    test('Has working min_equity filter', async function() {
        const response = await request(app).get('/jobs?min_equity=0.90').send({ _token: testUser.userToken });
        const jobs = response.body.jobs
        expect(response.statusCode).toBe(200);
        expect(jobs).toHaveLength(0);
    });

});


describe('GET /jobs/:id', function() {

    test('Gets 1 job', async function() {
        const response = await request(app).get(`/jobs/${testUser.jobId}`);
        const job = response.body.job;
        expect(response.statusCode).toBe(200);
        expect(job).toHaveProperty('title');
    });

    test('Responds with 400 if job is not found', async function() {
        const response = await request(app).get(`/jobs/0`);
        expect(response.body.message).toEqual("There exists no job with the id of '0'");
        expect(response.statusCode).toBe(404);
    });

});

describe('POST /jobs', function() {
    const newJob = {};

    test('Adds 1 job', async function() {
        const response = await request(app).post('/jobs').send({ _token: testUser.userToken, company_handle: testUser.currentCompany.handle, title: "newjob", salary: 25000 });
        newJob.id = response.body.newJob.id;
        const job = response.body.newJob;
        expect(response.statusCode).toBe(200);
        expect(job).toHaveProperty('title');
        await request(app).delete(`/jobs/${newJob.id}`).send({ _token: testUser.userToken });
    });

});

describe('PATCH /jobs/:id', async function() {

    test('Patch 1 job', async function() {
        const response = await request(app).patch(`/jobs/${testUser.jobId}`).send({ _token: testUser.userToken, company_handle: testUser.currentCompany.handle, title: "newtitle", salary: 25000 });
        const job = response.body.job;
        expect(response.statusCode).toBe(200);
        expect(job.title).toEqual("newtitle");
    });

    test('Responds with 404 if job is not found', async function() {
        const response = await request(app).patch('/jobs/0').send({ _token: testUser.userToken, company_handle: testUser.currentCompany.handle, title: "newtitle", salary: 25000 });
        expect(response.body.message).toEqual("There exists no job with the id of '0'");
        expect(response.statusCode).toBe(404);
    });

});

describe('DELETE /jobs/:id', async function() {

  test('Delete 1 job', async function() {
      const response = await request(app).delete(`/jobs/${testUser.jobId}`).send({ _token: testUser.userToken });
      expect(response.statusCode).toBe(200);
      expect(response.body.message).toEqual("Job deleted");
  });

  test('Responds with 404 if job is not found', async function() {
      const response = await request(app).delete('/jobs/0').send({ _token: testUser.userToken });
      expect(response.body.message).toEqual("There exists no job with the id of '0'");
      expect(response.statusCode).toBe(404);
  });

});