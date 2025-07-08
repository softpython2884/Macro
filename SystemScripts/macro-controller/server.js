
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('virtual-keyboard'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/virtual-keyboard/index.html');
});

app.post('/key', (req, res) => {
  const key = req.body.key;
  console.log("Received key:", key);
  exec(`python controller_input.py "${key}"`);
  res.sendStatus(200);
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
