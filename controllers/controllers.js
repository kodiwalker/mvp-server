//db connection
const { Translate } = require('@google-cloud/translate').v2;
const translate = new Translate();
const axios = require('axios');
let lastTranslatedText;
const countries = require('countries-list');
const countryTimezones = require('countries-and-timezones');
const moment = require('moment-timezone');

const countryMappings = {};

for (const countryCode in countries.countries) {
  const country = countries.countries[countryCode];

  // Select the first language and currency
  const firstLanguage = Object.keys(country.languages)[0];
  const currency = country.currency;

  // Get all timezones for this country
  const timezones = countryTimezones.getTimezonesForCountry(countryCode);

  countryMappings[countryCode] = {
    name: country.name,
    language: firstLanguage, // First ISO-639-1 code
    currency: currency, // ISO-4217 code
    timezones: timezones // All timezones for the country
  };
}

exports.getCountries = async (req, res) => {
  res.json(countryMappings);
}

exports.getTime = async (req, res) => {
  const { home, away } = req.body;
  // home or away should look like 'Country/TimeZone'

  async function getLocalTime(timezone) {
    const response = await axios.get(`http://worldtimeapi.org/api/timezone/${timezone}`);

    const unixTime = response.data.unixtime;
    const utcOffsetHours = parseInt(response.data.utc_offset);
    const localTime = moment.unix(unixTime).utcOffset(utcOffsetHours / 60).tz(timezone).format('YYYY-MM-DDTHH:mm:ss');

    return localTime;
  }

  try {
    const homeTime = await getLocalTime(home);
    const awayTime = await getLocalTime(away);

    res.json({ homeTime, awayTime });
  } catch (e) {
    console.error('Failed to get times:', e);
    res.status(500).json({ error: 'Failed to get times.' });
  }
}

exports.translate = async (req, res) => {
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

module.exports = exports;