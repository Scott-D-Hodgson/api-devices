import express from 'express';
import https from 'https';

const app = express();
const port = 3000;

let date = new Date();
let dateString = `${date.getYear() + 1900}-${("00" + (date.getMonth() + 1)).substring(-2,2)}-${("00" + date.getDate()).substring(-2,2)}`;
let devices = [];
let activity = [];
let online = [];
let offline = [];

function ResetDay(now, nowString) {
  let data = [];
  for (let i = 0, len = devices.length; i < len; i++) {
    data.push({
      device: devices[i],
      online: activity[i].online,
      offline: activity[i].offline
    });
  };
  devices = online;
  offline = [];
  activity = [];
  let dayStart = now.setHours(0).setMinutes(0).setSeconds(0).setMilliseconds(0);
  for (let i = 0, len = devices.length; i < len; i++){
    activity.push({
      online: [ dayStart ],
      offline: []
    });
  };
  date = now;
  dateString = nowString;
};

function CheckDate() {
  let now = new Date();
  let nowString = `${date.getYear() + 1900}-${("00" + (date.getMonth() + 1)).substring(-2,2)}-${("00" + date.getDate()).substring(-2,2)}`;
  if (dateString != nowString) {
    ResetDay(now, nowString);
  };
};

function Api(data) {
  let options = {
    hostname: 'maker.ifttt.com',
    path: '/trigger/notification/with/key/gmw1zJAfc4nxQY56ImXFd0pWOBlg94y9H_FK4Kp5oCM',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
  };
  let send = https.request(options, (response) => {
    let output = ''
    response.setEncoding('utf8')
    // Listener to receive data
    response.on('data', (chunk) => {
        output += chunk
    });
    // Listener for intializing callback after receiving complete response
    response.on('end', () => {
      // Ignore end
    });
  });
  // Handle any errors occurred while making request
  send.on('error', (err) => {
    // Swallow error
  });
  // Request is made here, with data as string or buffer
  send.write(data);
  // Ending the request
  send.end();
};

app.use(express.json());

app.all('*', function(req, res, next){
  CheckDate();
  next();
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});

app.post('/devices/online', (req, res) => {
  if (!req.body.hasOwnProperty('name')) {
    res.status(400).send();
    return;
  };
  if (devices.indexOf(req.body.name) === -1) {
    devices.push(req.body.name);
    activity.push({
      online: [],
      offline: []
    });
  };
  if (devices.indexOf(req.body.name) >= 0) {
    activity[devices.indexOf(req.body.name)].online.push(new Date());
  };
  if (online.indexOf(req.body.name) === -1) {
    online.push(req.body.name);
    let data = JSON.stringify({
      value1: 'Online: ' + req.body.name
    });
    Api(data);
  }; 
  if (offline.indexOf(req.body.name) >= 0) {
    offline.splice(offline.indexOf(req.body.name), 1);
  };
  res.status(200).send();
});

app.post('/devices/offline', (req, res) => {
  if (!req.body.hasOwnProperty('name')) {
    res.status(400).send();
    return;
  };
  if (devices.indexOf(req.body.name) === -1) {
    devices.push(req.body.name);
    activity.push({
      online: [],
      offline: []
    });
  };
  if (devices.indexOf(req.body.name) >= 0) {
    activity[devices.indexOf(req.body.name)].offline.push(new Date());
  };
  if (offline.indexOf(req.body.name) === -1) {
    offline.push(req.body.name);
    let data = JSON.stringify({
      value1: 'Offline: ' + req.body.name
    });
    Api(data);
  };
  if (online.indexOf(req.body.name) >= 0) {
    online.splice(online.indexOf(req.body.name), 1);
  };
  res.status(200).send();
});

app.get('/', (req, res) => {
  res.status(200).json({
    online,
    offline
  });
});

app.get('/activity', (req, res) => {
  let data = [];
  for (let i = 0, len = devices.length; i < len; i++) {
    data.push({
      device: devices[i],
      online: activity[i].online,
      offline: activity[i].offline
    });
  };
  res.status(200).json(data);
});