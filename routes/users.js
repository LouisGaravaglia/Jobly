const express = require('express');
const ExpressError = require('../helpers/ExpressError');
const { ensureCorrectUser, authRequired, validateSchema } = require('../middleware/auth');
const User = require('../models/users');
const userNewSchema = require('../schemas/userNewSchema.json');
const userUpdateSchema = require('../schemas/userUpdateSchema.json');
const createToken = require('../helpers/createToken');
const router = express.Router();

router.get('/', authRequired, async function(req, res, next) {
    try {
        const users = await User.findAll();
        return res.json({ users });
    } catch (err) {
        return next(err);
    }
});

router.get('/:username', authRequired, async function(req, res, next) {
    try {
        const user = await User.findOne(req.params.username);
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});

router.post('/', async function(req, res, next) {
    try {
        validateSchema(userNewSchema)
        const user = await User.register(req.body);
        const token = createToken(user);
        return res.status(201).json({ user : { user, token } });
    } catch (err) {
        return next(err);
    }
});

router.patch('/:username', ensureCorrectUser, async function(req, res, next) {
    try {
        if ('username' in req.body || 'is_admin' in req.body) {
            throw new ExpressError(
            'You are not allowed to change username or is_admin properties.',
            400);
        }
        validateSchema(userUpdateSchema)
        const user = await User.update(req.params.username, req.body);
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});

router.delete('/:username', ensureCorrectUser, async function(req, res, next) {
    try {
        await User.remove(req.params.username);
        return res.json({ message: 'User deleted' });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;