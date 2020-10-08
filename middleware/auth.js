const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const ExpressError = require("../helpers/ExpressError");
const jsonschema = require("jsonschema");

function validateSchema(schema) {
  return function validate(req, res, next) {
    const result = jsonschema.validate(req.body, schema);
    if (!result.valid) {
        const listOfErrors = result.errors.map(e => e.stack);
        const error = new ExpressError(listOfErrors, 400);
        return next(error);
    }
  }
};

function authRequired(req, res, next) {
  try {
    const tokenStr = req.body._token || req.query._token;
    let token = jwt.verify(tokenStr, SECRET_KEY);
    res.locals.username = token.username;
    return next();
  } catch (err) {
    return next(new ExpressError("You must authenticate first", 401));
  }
};

function adminRequired(req, res, next) {
  try {
    const tokenStr = req.body._token;
    let token = jwt.verify(tokenStr, SECRET_KEY);
    res.locals.username = token.username;
    if (token.is_admin) {
      return next();
    }
    throw new Error();
  } catch (err) {
    return next(new ExpressError("You must be an admin to access", 401));
  }
};

function ensureCorrectUser(req, res, next) {
  try {
    const tokenStr = req.body._token;
    let token = jwt.verify(tokenStr, SECRET_KEY);
    res.locals.username = token.username;
    if (token.username === req.params.username) {
      return next();
    }
    throw new Error();
  } catch (err) {
    return next(new ExpressError("Unauthorized", 401));
  }
};

module.exports = {
  authRequired,
  adminRequired,
  ensureCorrectUser,
  validateSchema
};
