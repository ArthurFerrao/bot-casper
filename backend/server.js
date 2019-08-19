const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');

const noticiaRoutes = require('./src/controllers/noticia.controller');
const webhookRoutes = require('./src/controllers/webhook.controller');

const port = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost/noticiasdb', { useNewUrlParser: true })
  .then(() => console.log('Connected to database...'))
  .catch(err => console.error(err));


const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(morgan("dev"));
app.use(cors());



express.Router().get('/', (req, res) => {
    return res.json({ status: 'running' });
});

app.use('/webhook', webhookRoutes);
app.use('/noticia', noticiaRoutes);

app.listen(port, () => console.log(`Listening on port ${port}`));