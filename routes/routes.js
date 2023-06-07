const express = require('express');

const router = express.Router();

const {
  getCountries, getTime, translate
} = require('../controllers/controllers');

router.get('/countrydata', getCountries)

router.post('/time', getTime);

router.post('/translate', translate);

module.exports = router;
