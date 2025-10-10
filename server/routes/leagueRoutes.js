const express = require('express');
const router = express.Router();

const { updateLeagues, getUserLeague, getAllLeagues,getCurrentWeekPeriodHandler } = require('../controllers/leagueController');

// POST /api/league/update : update leagues with promotion/demotion logic for the new period
router.post('/update', updateLeagues);

// GET /api/league/user/:userId : get league info for a specific user by MongoDB ID
router.get('/user/:userId', getUserLeague);

// GET /api/league/all : get league info for all users
router.get('/all', getAllLeagues);

router.get('/weekPeriod', getCurrentWeekPeriodHandler);


module.exports = router;
