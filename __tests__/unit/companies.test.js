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
        "INSERT INTO jobs (title, salary, company_handle) VALUES ('Software Engineer', 100000, $1) RETURNING *",
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

describe('GET /companies', async function() {

    test('Gets a list of 1 company', async function() {
        const response = await request(app).get('/companies');
        const companies = response.body.companies;
        expect(response.statusCode).toBe(200);
        expect(companies).toHaveLength(1);
        expect(companies[0]).toHaveProperty('handle');
    });

    test('Has working search', async function() {
        const response = await request(app).get('/companies?search=testcompany').send({ _token: testUser.userToken });
        const companies = response.body.companies
        expect(response.statusCode).toBe(200);
        expect(companies).toHaveLength(1);
        expect(companies[0]).toHaveProperty('handle');
    });

    test('Has working max_employee search', async function() {
        const response = await request(app).get('/companies?search=testcompany&max_employees=500').send({ _token: testUser.userToken });
        const companies = response.body.companies
        expect(response.statusCode).toBe(200);
        expect(companies).toHaveLength(0);
    });

    test('Has working min_employee search', async function() {
        const response = await request(app).get('/companies?search=testcompany&min_employees=1200').send({ _token: testUser.userToken });
        const companies = response.body.companies
        expect(response.statusCode).toBe(200);
        expect(companies).toHaveLength(0);
    });

});

describe('GET /companies/:handle', async function() {

    test('Gets 1 company', async function() {
        const response = await request(app).get('/companies/testcompany');
        const company = response.body.company;
        expect(response.statusCode).toBe(200);
        expect(company).toHaveProperty('handle');
    });

    test('Responds with 400 if company is not found', async function() {
        const response = await request(app).get('/companies/nonexistentcompany');
        expect(response.body.message).toEqual('No company exists with that handle');
        expect(response.statusCode).toBe(400);
    });

});

describe('POST /companies', async function() {

    test('Adds 1 company', async function() {
        const response = await request(app).post('/companies').send({ _token: testUser.userToken, company: { handle: "newtest", name: "newtestcompany", num_employees: 40000 } });
        console.log(response.body);
        const company = response.body.company[0];
        expect(response.statusCode).toBe(201);
        expect(company).toHaveProperty('handle');
    });

    test('Responds with error if company already exists', async function() {
        const response = await request(app).post('/companies').send({ _token: testUser.userToken, company: { handle: "testcompany", name: "testcompany inc", num_employees: 40000 }});
        expect(response.body.message).toEqual("There is already a company with that handle");
        expect(response.statusCode).toBe(400);
    });

});

describe('PATCH /companies/:handle', async function() {

    test('Patch 1 company', async function() {
        const response = await request(app).patch('/companies/testcompany').send({ _token: testUser.userToken, name: "newtestcompany", num_employees: 5 });
        const company = response.body.company;
        expect(response.statusCode).toBe(200);
        expect(company.num_employees).toEqual(5);
    });

    test('Responds with 404 if company is not found', async function() {
        const response = await request(app).patch('/companies/nonexistentcompany').send({ _token: testUser.userToken, name: "newtestcompany", num_employees: 5  });
        expect(response.body.message).toEqual("There exists no company 'nonexistentcompany");
        expect(response.statusCode).toBe(404);
    });

});

describe('DELETE /companies/:handle', async function() {

  test('Delete 1 company', async function() {
      const response = await request(app).delete('/companies/testcompany').send({ _token: testUser.userToken });
      expect(response.statusCode).toBe(200);
      expect(response.body.message).toEqual("Company deleted");
  });

  test('Responds with 400 if company is not found', async function() {
      const response = await request(app).delete('/companies/nonexistentcompany').send({ _token: testUser.userToken });
      expect(response.body.message).toEqual("No company exists with the handle nonexistentcompany");
      expect(response.statusCode).toBe(400);
  });

});