var express = require('express'),
    bodyParser = require('body-parser'),
    nodemailer = require('nodemailer'),
    fs = require('fs'),
    app = express();

var mailerConfig = JSON.parse(fs.readFileSync('mailer-config.json'));

var transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: mailerConfig.user,
    pass: mailerConfig.pass
  }
});

app.use(express.static(__dirname + '/html'));
app.use(bodyParser.json({limit: '10mb'}));

app.post('/sendMms', function (req, res) {
  //console.log(req.body);

  if (!(req.body && req.body.carrier && req.body.number)) {
    res.status(500).send('Please specify both carrier and phone number');
    return;
  }

  var mail = {
    from: mailerConfig.from,
    to: req.body.number + req.body.carrier,
    subject: 'New Space Cam Snapshot',
    text: 'You have a new Space Cam snapshot.',
    attachments: [
      { path: req.body.dataUrl }
    ]
  };

  transporter.sendMail(mail, function(err, info){
    if (err) {
      res.status(500).send(err);
      return;
    }

    console.log('Message sent: ' + info.response);
    res.send('OK');
  });
});

app.listen(8080, '0.0.0.0');
