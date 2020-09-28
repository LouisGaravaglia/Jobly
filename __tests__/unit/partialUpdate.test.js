process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../../app");
const ExpressError = require("../../helpers/expressError");
const db = require("../../db")
const sqlForPartialUpdate = require("../../helpers/partialUpdate");
// const { expect } = require("chai");

// const Book = require("../models/book");
// const jsonschema = require("jsonschema");
// const bookSchema = require("../schemas/bookSchema.json");


// function sqlForPartialUpdate(table, items, key, id) {
//   // keep track of item indexes
//   // store all the columns we want to update and associate with vals
//   let idx = 1;
//   let columns = [];
//   // filter out keys that start with "_" -- we don't want these in DB
//   for (let key in items) {
//     if (key.startsWith("_")) {
//       delete items[key];
//     }
//   }
//   for (let column in items) {
//     columns.push(`${column}=$${idx}`);
//     idx += 1;
//   }
//   // build query
//   let cols = columns.join(", ");
//   let query = `UPDATE ${table} SET ${cols} WHERE ${key}=$${idx} RETURNING *`;
//   let values = Object.values(items);
//   values.push(id);
//   return { query, values };
// }

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
