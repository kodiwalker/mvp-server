require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const router = require('./routes/routes');
const cors = require('cors');

const app = express();

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use('/', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server available at http://localhost:${PORT}`);
});
