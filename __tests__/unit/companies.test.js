process.env.NODE_ENV = "test";
const request = require('supertest');
const app = require('../../app');
const db = require("../../db")

testUser = {};

beforeEach(async function(testUser) {
  try {
    const hashedPassword = await bcrypt.hash('secret', 1);
    await db.query(
      `INSERT INTO users (username, password, first_name, last_name, email, is_admin)
                  VALUES ('test', $1, 'tester', 'mctest', 'test@rithmschool.com', true)`,
      [hashedPassword]
    );

    const response = await request(app)
      .post('/login')
      .send({
        username: 'test',
        password: 'secret'
      });

      testUser.userToken = response.body.token;
      testUser.currentUsername = jwt.decode(testUser.userToken).username;

    const result = await db.query(
      'INSERT INTO companies (handle, name, num_employees) VALUES ($1, $2, $3) RETURNING *',
      ['rithm', 'rithm inc', 1000]
    );

    testUser.currentCompany = result.rows[0];

    const newJob = await db.query(
      "INSERT INTO jobs (title, salary, company_handle) VALUES ('Software Engineer', 100000, $1) RETURNING *",
      [testUser.currentCompany.handle]
    );
    testUser.jobId = newJob.rows[0].id;

  } catch (error) {
    console.error(error);
  }
});

afterEach(async function() {
  try {
    await db.query('DELETE FROM applications');
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


describe('POST /companies', async function() {
  test('Creates a new company', async function() {
    const response = await request(app)
      .post('/companies')
      .send({
        handle: 'whiskey',
        name: 'Whiskey'
      });
    expect(response.statusCode).toBe(201);
    expect(response.body.company).toHaveProperty('handle');
  });

  test('Prevents creating a company with duplicate handle', async function() {
    const response = await request(app)
      .post('/companies')
      .send({
        _token: testUser.userToken,
        handle: 'rithm',
        name: 'Test'
      });
    expect(response.statusCode).toBe(400);
  });
});

describe('GET /companies', async function() {
  test('Gets a list of 1 company', async function() {
    const response = await request(app).get('/companies');
    expect(response.body.companies).toHaveLength(1);
    expect(response.body.companies[0]).toHaveProperty('handle');
  });

  test('Has working search', async function() {
    await request(app)
      .post('/companies')
      .set('authorization', `${testUser.userToken}`)
      .send({
        _token: testUser.userToken,
        handle: 'hooli',
        name: 'Hooli'
      });

    await request(app)
      .post('/companies')
      .set('authorization', `${testUser.userToken}`)
      .send({
        _token: testUser.userToken,
        handle: 'pp',
        name: 'Pied Piper'
      });

    const response = await request(app)
      .get('/companies?search=hooli')
      .send({
        _token: testUser.userToken
      });
    expect(response.body.companies).toHaveLength(1);
    expect(response.body.companies[0]).toHaveProperty('handle');
  });
});

describe('GET /companies/:handle', async function() {
  test('Gets a single a company', async function() {
    const response = await request(app)
      .get(`/companies/${testUser.currentCompany.handle}`)
      .send({
        _token: testUser.userToken
      });
    expect(response.body.company).toHaveProperty('handle');
    expect(response.body.company.handle).toBe('rithm');
  });

  test('Responds with a 404 if it cannot find the company in question', async function() {
    const response = await request(app)
      .get(`/companies/yaaasss`)
      .send({
        _token: testUser.userToken
      });
    expect(response.statusCode).toBe(404);
  });
});

describe('PATCH /companies/:handle', async function() {
  test("Updates a single a company's name", async function() {
    const response = await request(app)
      .patch(`/companies/${testUser.currentCompany.handle}`)
      .send({
        name: 'xkcd',
        _token: testUser.userToken
      });
    expect(response.body.company).toHaveProperty('handle');
    expect(response.body.company.name).toBe('xkcd');
    expect(response.body.company.handle).not.toBe(null);
  });

  test('Prevents a bad company update', async function() {
    const response = await request(app)
      .patch(`/companies/${testUser.currentCompany.handle}`)
      .send({
        _token: testUser.userToken,
        cactus: false
      });
    expect(response.statusCode).toBe(400);
  });

  test('Responds with a 404 if it cannot find the company in question', async function() {
    // delete company first
    await request(app).delete(`/companies/${testUser.currentCompany.handle}`);
    const response = await request(app)
      .patch(`/companies/taco`)
      .send({
        name: 'newTaco',
        _token: testUser.userToken
      });
    expect(response.statusCode).toBe(404);
  });
});

describe('DELETE /companies/:handle', async function() {
  test('Deletes a single a company', async function() {
    const response = await request(app)
      .delete(`/companies/${testUser.currentCompany.handle}`)
      .send({
        _token: testUser.userToken
      });
    expect(response.body).toEqual({ message: 'Company deleted' });
  });

  test('Responds with a 404 if it cannot find the company in question', async function() {
    // delete company first
    const response = await request(app)
      .delete(`/companies/notme`)
      .send({
        _token: testUser.userToken
      });
    expect(response.statusCode).toBe(404);
  });
});

