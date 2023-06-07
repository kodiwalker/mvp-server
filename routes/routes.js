const express = require('express');

const router = express.Router();

const {
  getCountries, getTime, translate, convert
} = require('../controllers/controllers');

router.get('/countrydata', getCountries)

router.post('/time', getTime);

router.post('/translate', translate);

router.post('/convert', convert);

module.exports = router;
