const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const FyersSocket = require("fyers-api-v3").fyersDataSocket;
const dotenv = require('dotenv');
const cors = require('cors')
const connectDB = require('./db/db');
const handleFyersError = require('./utils');
dotenv.config();
const axios = require('axios')
const jwt = require('jsonwebtoken')
const cron = require('node-cron'); // Import node-cron
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});
const port = 5000;
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process');
const FyersAPI = require('fyers-api-v3');
const fyers = new FyersAPI.fyersModel();
fyers.setAppId(process.env.APP_ID);
fyers.setRedirectUrl('https://www.rgstartup.com/');
fyers.setAccessToken(process.env.ACCESS_TOKEN);

// Node Cron Restart scheduled
// Schedule for 8:00 AM IST
cron.schedule('0 0 8 * * *', () => {
    console.log('Restarting server at 8:00 AM IST...');
    exec('pm2 reload 0', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        if (stderr) {
            console.log(`stderr: ${stderr}`);
        }
    });
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});
// Using Cors
app.use(cors({
    origin: "http://localhost:3000"
}));
// Establishing Database Connection
connectDB();
// Fyers Token Generating Process
async function refreshAccessToken() {
    try {
        const apiUrl = 'https://api-t1.fyers.in/api/v3/validate-refresh-token';
        const refresh_token = process.env.REFRESH_TOKEN;

        const requestData = {
            grant_type: 'refresh_token',
            appIdHash: 'F3N9X26T6W-100',
            refresh_token: refresh_token,
            pin: '1111', // Update with your pin or remove if not needed
        };

        const response = await axios.post(apiUrl, requestData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('Access token refreshed successfully');
        return response.data.access_token;
    } catch (error) {
        console.error('Error refreshing access token:', error.message);
        throw error;
    }
}
function restartServer() {
    console.log('Restarting Express server...');
    exec('pm2 reload 0', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error restarting server: ${error}`);
            return;
        }
        console.log(`Server restarted successfully: ${stdout}`);
    });
}
async function createFyersSocket() {
    try {
        const decodedToken = jwt.decode(process.env.ACCESS_TOKEN);
        if (decodedToken && decodedToken.exp * 1000 < Date.now()) {
            console.log('Access token is expired. Refreshing...');
            const newAccessToken = await refreshAccessToken();
            process.env.ACCESS_TOKEN = newAccessToken;

            // Load .env file
            const envFilePath = path.resolve('./.env');
            const envContents = fs.readFileSync(envFilePath, 'utf8');
            const updatedEnvContents = envContents.replace(/^ACCESS_TOKEN=.*/m, `ACCESS_TOKEN='${newAccessToken}'`);

            // Update .env file with new access token
            fs.writeFileSync(envFilePath, updatedEnvContents);

            console.log("This is Your New Access Token \n", newAccessToken);
            // Restart the Express server
            restartServer();
        }
        const fyersdata = new FyersSocket(process.env.ACCESS_TOKEN);
        return fyersdata;
    } catch (error) {
        // Handle the error here
        console.error('Error creating FyersSocket instance:', error.message);
        throw error;
    }
}
// Under Developing Logic when Auth Token Expires
app.get('/emer/authorize', (req, res) => {
    const generateAuthcodeURL = fyers.generateAuthCode();
    console.log(generateAuthcodeURL);
    res.redirect(generateAuthcodeURL);
});
app.get('/gency/authenticate', async (req, res) => {
    try {
        const authCode = process.env.AUTH_TOKEN;
        console.log(process.env.AUTH_TOKEN);
        const secretKey = process.env.SECRET_KEY;

        const response = await fyers.generate_access_token({
            secret_key: secretKey,
            auth_code: authCode,
        });

        console.log(response);
        if (response.code === 200) {
            res.send('Access Token generated');
        } else {
            res.status(response.code).send(response.message);
        }
    } catch (error) {
        handleFyersError(res, error);
    }
});
// All the Symbols
//  const stockSymbols = {
//     'nifty': 'NSE:NIFTY50-INDEX',
//     'banknifty': 'NSE:NIFTYBANK-INDEX',
//     'sensex': 'BSE:SENSEX-INDEX',
//     'finnifty': 'NSE:FINNIFTY-INDEX',
//     'midcpnifty': 'NSE:MIDCPNIFTY-INDEX',
//     'bankex': 'BSE:BANKEX-INDEX',
//     'reliance': 'NSE:RELIANCE-EQ',
//     'bajfinance': 'NSE:BAJFINANCE-EQ',
//     'hdfcbank': 'NSE:HDFCBANK-EQ',
//     'sbin': 'NSE:SBIN-EQ',
//     'axisbank': 'NSE:AXISBANK-EQ',
//     'icicibank': 'NSE:ICICIBANK-EQ',
//     'infy': 'NSE:INFY-EQ',
//     'tcs': 'NSE:TCS-EQ',
// };

// Socket Config
createFyersSocket().then((fyersdata) => {
    // Main Api Routes
    app.use('/db', require('./routes/db-routes')); // This is For Historical Stock data Page 
    app.use('/api/v3', require('./routes/index')); // Give Status,Ticker,Futures,Future-LTP
    app.use('/option-chain', require('./routes/option-routes'));
    app.use('/records', require('./routes/records'));
    app.get('/', (req, res) => {
        res.send("Welcome to Stock Monitoring Server");
        console.log("Welcome Mr. Lakshay")
    });
    io.on('connection', (socket) => {
        let subscribedSymbols = [];

        function onmsg(message) {
            // console.log(message);
            socket.emit('symbolData', message);
        }
        function onconnect() {
            fyersdata.subscribe(subscribedSymbols)
            fyersdata.autoreconnect();
        }
        function onerror(err) {
            // console.log(err.message);
        }
        function onclose() {
            console.log("socket closed");
            fyersdata.unsubscribe(subscribedSymbols)
        }

        socket.on('SpotLTPData', (symbol) => {
            const originalSymbol = symbol;
            if (originalSymbol) {
                subscribedSymbols = [(originalSymbol)]
                onconnect()
            }
        });
        socket.on('FutureLTPData', (symbol) => {
            const originalSymbol = symbol;
            if (originalSymbol) {
                subscribedSymbols.push(originalSymbol)
                onconnect()
            }
        });
        socket.on('OptionSymbolData', (symbol) => {
            const originalSymbol = symbol;
            if (originalSymbol) {
                // console.log(originalSymbol);
                subscribedSymbols.push(...originalSymbol)
                // console.log(subscribedSymbols);
                onconnect()
            }
        });
        socket.on('disconnect', () => {
            fyersdata.unsubscribe(subscribedSymbols)
        });
        fyersdata.on("message", onmsg);
        fyersdata.on("connect", onconnect);
        fyersdata.on("error", onerror);
        fyersdata.on("close", onclose);

        fyersdata.connect();
    });
    // Connect to fyersdata socket
    // fyersdata.connect().catch((err) => {
    //     console.log("Fyers Errro In Instance:)");
    // });

}).catch((err) => {
    console.log("Not Able To Create fyers Socket :)");
})


// Server Up & Running
server.listen(port, () => {
    console.log(`Server Live At Port ${port}.`);
});
