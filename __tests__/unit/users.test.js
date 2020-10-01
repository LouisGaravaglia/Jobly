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

describe('GET /users', function() {

    test('Gets a list of all users', async function() {
        const response = await request(app).get('/users').send({ _token: testUser.userToken });
        const users = response.body.users;
        expect(response.statusCode).toBe(200);
        expect(users).toHaveLength(1);
        expect(users[0]).toHaveProperty('username');
    });

});

describe('GET /users/:username', function() {

    test('Gets 1 user', async function() {
            const response = await request(app).get(`/users/testusername`).send({ _token: testUser.userToken });
            const user = response.body.user;
            expect(response.statusCode).toBe(200);
            expect(user).toHaveProperty('username');
    });

    test('Responds with error if user not found', async function() {
        const response = await request(app).get(`/users/nonexistentusername`).send({ _token: testUser.userToken });
        const user = response.body.user;
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toEqual("There exists no user 'nonexistentusername'");
    });

});

describe('POST /users', function() {
    const newUser = {};

    test('Adds 1 user', async function() {
        const response = await request(app).post('/users').send({ username: "newusername", password: "newpassword", email: "newemail@gmail.com" });
        newUser.username = response.body.user.user.username;
        expect(response.statusCode).toBe(201);
        expect(response.body.user.user).toHaveProperty('username');
        expect(response.body.user.user.email).toEqual('newemail@gmail.com');
        await request(app).delete(`/users/${newUser.username}`).send({ _token: testUser.userToken });
    });

    test('Responds with error message if user already exists', async function() {
        const response = await request(app).post('/users').send({ username: "testusername", password: "newpassword", email: "newemail@gmail.com" });
        console.log(response.body);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toEqual("There already exists a user with username 'testusername'");
    });

});

describe('PATCH /users/:username', async function() {

    test('Patch 1 user', async function() {
        const response = await request(app).patch('/users/testusername').send({ _token: testUser.userToken, password: "newpassword", email: "newemail@gmail.com" });
        expect(response.statusCode).toBe(200);
        expect(response.body.user).toHaveProperty('username');
        expect(response.body.user.email).toEqual('newemail@gmail.com');
    });

    test('Expect error message if trying to patch a username property of a user', async function() {
        const response = await request(app).patch('/users/testusername').send({ _token: testUser.userToken, username: "newusername", password: "newpassword", email: "newemail@gmail.com" });
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toEqual('You are not allowed to change username or is_admin properties.');
    });

    test('Expect error message if trying to patch a user that doesnt exist', async function() {
        const response = await request(app).patch('/users/nonexistentuser').send({ _token: testUser.userToken, password: "newpassword", email: "newemail@gmail.com" });
        console.log(response.body);
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toEqual('Unauthorized');
    });

});

describe('DELETE /users/:username', async function() {

    test('Responds with 404 if job is not found', async function() {
        const response = await request(app).delete('/users/nonexistentuser').send({ _token: testUser.userToken });
        console.log(response.body);
        expect(response.body.message).toEqual('Unauthorized');
        expect(response.statusCode).toBe(401);
    });

    test('Delete 1 user', async function() {
        const response = await request(app).delete(`/users/testusername`).send({ _token: testUser.userToken });
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toEqual("User deleted");
    });
  
  });
