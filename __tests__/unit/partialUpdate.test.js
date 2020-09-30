process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../../app");
const ExpressError = require("../../helpers/expressError");
const db = require("../../db")
const sqlForPartialUpdate = require("../../helpers/partialUpdate");

afterAll(async function() {
    await db.end()
})

describe("partialUpdate()", () => {
  it("should generate a proper partial update query with just 1 field", function() {
      const { query, values } = sqlForPartialUpdate("users", {first_name:"UPDATEDfirstname"}, "username", "testusername1") 
    expect(query).toEqual("UPDATE users SET first_name=$1 WHERE username=$2 RETURNING *")
    expect(values).toEqual(["UPDATEDfirstname", "testusername1"])
  });
});
