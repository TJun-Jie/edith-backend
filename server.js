const express = require('express');
const bodyParser = require('body-parser');
const Terra = require('terra-api').default;
const http = require('http');
const Server = require('socket.io').Server;
const terra = new Terra("eIOWkUkrUCfob81XS3rHlx8h0wX-06R7", "nocomponay-testing-YpK3oRSrky", "4ffc2fd286b8f9c3169872bf642c3d138340031a37107d30");
const cors = require('cors');
const querystring = require('querystring');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));

const SPOTIFY_CLIENT_ID = "4813024f30024c439959dba65088bd0f";
const SPOTIFY_CLIENT_SECRET = "4fc2c96cac0e4c79aa145fb7698c5309";
const SPOTIFY_REDIRECT_URI = "http://localhost:3000/callback";

 
const client_id = SPOTIFY_CLIENT_ID;
const client_secret = SPOTIFY_CLIENT_SECRET;
const refresh_token = "4fc2c96cac0e4c79aa145fb7698c5309";

function generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

 
const options = {
  inflate: true,
  limit: "4000kb",
  type: "application/json",
};

app.use(bodyParser.raw(options));

app.get("/", function (req, res) {
  res.send('Hello World!'); // send a basic response
});

app.get('/login', function(req, res) {

    var state = generateRandomString(16);
    var scope = 'user-read-private user-read-email';
  
    res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: "http://localhost:3000/callback",
        state: state
      }));
  });

  const port = 4000;

  
  function calculateStress(heartData) {
    const avgHrvSdnn = heartData.heart_rate_data.summary.avg_hrv_sdnn;
    const avgHrBpm = heartData.heart_rate_data.summary.avg_hr_bpm;
    const maxHrBpm = heartData.heart_rate_data.summary.max_hr_bpm;
    const minHrBpm = heartData.heart_rate_data.summary.min_hr_bpm;

    // Set arbitrary thresholds for this example
    const hrvThresholdLow = 40;  // Below this HRV (SDNN) value is considered high stress
    const hrvThresholdMedium = 60; // Below this HRV (SDNN) value is considered medium stress

    const highHrThresholdHigh = maxHrBpm * 1.15; // 15% above max is considered high stress
    const highHrThresholdMedium = maxHrBpm * 1.1; // 10% above max is considered medium stress

    const lowHrThresholdHigh = minHrBpm * 0.85; // 15% below min is considered high stress
    const lowHrThresholdMedium = minHrBpm * 0.9; // 10% below min is considered medium stress

    if (avgHrvSdnn < hrvThresholdLow || avgHrBpm > highHrThresholdHigh || avgHrBpm < lowHrThresholdHigh) {
        return "high";
    } else if (avgHrvSdnn < hrvThresholdMedium || avgHrBpm > highHrThresholdMedium || avgHrBpm < lowHrThresholdMedium) {
        return "medium";
    } else {
        return "low";
    }
}

// Usage

  

app.post("/consumeTerraWebhook", function (req, res) {
  const data = JSON.parse(req.body);
  console.log(data);
  if(data.type === "body"){


  const heartData = data.data[0].heart_data;
  const stressLevel = calculateStress(heartData);

  
  broadcastMessage('stress', stressLevel);
  }
  let verified = false;
  
  try {
    verified = terra.checkTerraSignature(req.headers['terra-signature'], req.body);
  } catch (err) {
    console.error("Verification failed:", err);
  }
  
  if (verified) {
    // handle verified data
  } else {
    // handle non-verified data or reject
  }

  res.sendStatus(200);
});

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // assuming your frontend runs on this port
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.emit('data', { message: 'Hello from backend!' });
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

function broadcastMessage(event, message) {
    io.emit(event, message);
  }

  app.get('/sendNotification', (req, res) => {
    broadcastMessage('notification', { text: 'This is a notification from the backend!' });
    res.send('Notification sent to all clients.');
  });



httpServer.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
