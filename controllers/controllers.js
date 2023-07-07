const { Translate } = require('@google-cloud/translate').v2;
const translate = new Translate();
const axios = require('axios');
let lastTranslatedText;
const countries = require('countries-list');
const countryTimezones = require('countries-and-timezones');
const moment = require('moment-timezone');
const { body, validationResult } = require('express-validator');

const countryMappings = {};

for (const countryCode in countries.countries) {
  const country = countries.countries[countryCode];
  const firstLanguage = country.languages[0]
  const currency = country.currency.length > 3 ? country.currency.split(',')[0] : country.currency;
  const timezones = countryTimezones.getTimezonesForCountry(countryCode);

  countryMappings[countryCode] = {
    name: country.name,
    language: firstLanguage,
    currency: currency,
    timezones: timezones
  };
}

exports.getCountries = async (req, res) => {
  res.json(countryMappings);
}

exports.getTime = [
  body('home').trim().escape(),
  body('away').trim().escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { home, away } = req.body;
    async function getLocalTime(timezone) {
      const response = await axios.get(`http://worldtimeapi.org/api/timezone/${timezone}`);
      const unixTime = response.data.unixtime;
      const localTime = moment.unix(unixTime).tz(timezone).format('YYYY-MM-DDTHH:mm:ss');
      return localTime;
    }

    try {
      const homeTime = await getLocalTime(home);
      const awayTime = await getLocalTime(away);
      res.json({ homeTime, awayTime });
    } catch (e) {
      console.error('Failed to get times:', e.error);
      res.status(500).json({ error: 'Failed to get times.' });
    }
  }
];

exports.translate = [
  body('text').trim().escape(),
  body('target').trim().escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text, target } = req.body;
    if (text.trim() === '' || text === lastTranslatedText || text.trim() === lastTranslatedText) {
      lastTranslatedText = text;
      res.sendStatus(400);
      return;
    }

    lastTranslatedText = text;
    try {
      const [translation] = await translate.translate(text, target);
      res.json(translation);
    } catch (e) {
      console.error('Failed to translate:', e)
      res.status(500).json({ error: 'Translate failed...' })
    }
  }
];

exports.convert = [
  body('home').trim().escape(),
  body('away').trim().escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { home, away } = req.body;
    try {
      const [homeRateData, awayRateData] = await Promise.all([
        axios.get(`https://v6.exchangerate-api.com/v6/44a819715fd986bd0cf9ad89/enriched/${home}/${away}`).then(res => res.data),
        axios.get(`https://v6.exchangerate-api.com/v6/44a819715fd986bd0cf9ad89/enriched/${away}/${home}`).then(res => res.data)
      ]);
      res.json({ homeRateData, awayRateData });
    } catch (e) {
      console.error('Failed to get conversion rates:', e)
      res.status(500).json({ error: 'Failed to get conversion rates...' })
    }
  }
];

module.exports = exports;
