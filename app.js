var express = require('express'),
    app = express();

app.use(express.static(__dirname + '/html'));
app.listen(8080, '0.0.0.0');
