const express = require("express");
const ExpressError = require("./helpers/expressError");
const morgan = require("morgan");
const app = express();
const companyRoutes = require("./routes/companies");
const jobRoutes = require("./routes/jobs");
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const Company = require("./models/companies");

app.use(express.json());

app.use("/companies", companyRoutes);
app.use("/jobs", jobRoutes);
app.use('/users', usersRoutes);
app.use('/', authRoutes);

app.use(function(req, res, next) {
    const err = new ExpressError("Not Found", 404);
    return next(err);
});

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.error(err.stack);
    return res.json({
      status: err.status,
      message: err.message
    });
});

module.exports = app;
