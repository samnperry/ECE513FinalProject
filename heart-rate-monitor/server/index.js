var express = require('express');
var cors = require('cors');

var app = express();
app.use(cors());
app.use(express.json());

app.get('/', function (req, res) {
    res.send('Hello World!');
});
