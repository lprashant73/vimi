const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const router = require('./router/routes');
const dotenve = require('dotenv');
dotenve.config({ path: './config.env' });
const port = process.env.PORT || 5000 ;
require('./mongodbConnect/connection.js');

app.use(cors());
app.use(express.json());
app.use(`/pictures`, express.static(path.join(__dirname, '/'+'pictures')));
app.use(router);
app.use((error, req, res, next) => {
    const status = error.statusCode;
    const message = error.message;
    return res.json({ message, status });
});
app.listen(port, () => {
    console.log(`Server is running at ${port}`);
}); 
