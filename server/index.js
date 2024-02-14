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
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const port = 5000;
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
            pin: '1122', // Update with your pin or remove if not needed
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
async function createFyersSocket() {
    try {
        const decodedToken = jwt.decode(process.env.ACCESS_TOKEN);
        if (decodedToken && decodedToken.exp * 1000 < Date.now()) {
            console.log('Access token is expired. Refreshing...');
            const newAccessToken = await refreshAccessToken();
            process.env.ACCESS_TOKEN = newAccessToken;
            console.log("This is Your New Access Token \n", newAccessToken);
        }
        const fyersdata = new FyersSocket(process.env.ACCESS_TOKEN);
        return fyersdata;
    } catch (error) {
        // Handle the error here
        console.error('Error creating FyersSocket instance:', error.message);
        throw error;
    }
}
// const fyersdata = createFyersSocket()

// Main Api Routes
app.use('/api/v3', require('./routes/index')); // Give Status,Ticker,Futures,Future-LTP
app.use('/db', require('./routes/db-routes')); // This is For Historical Stock data Page 
app.use('/records', require('./routes/records'));
app.use('/option-chain', require('./routes/option-routes'));
app.get('/', (req, res) => {
    res.send("Welcome to Stock Monitoring Server");
    console.log("Welcome Mr. Lakshay")
});

// WebSocket Connection are Currently OFF
io.off('connection', (socket) => {
    // All the Symbols
    const stockSymbols = {
        'nifty': 'NSE:NIFTY50-INDEX',
        'banknifty': 'NSE:NIFTYBANK-INDEX',
        'sensex': 'BSE:SENSEX-INDEX',
        'finnifty': 'NSE:FINNIFTY-INDEX',
        'midcpnifty': 'NSE:MIDCPNIFTY-INDEX',
        'bankex': 'BSE:BANKEX-INDEX',
        'reliance': 'NSE:RELIANCE-EQ',
        'bajfinance': 'NSE:BAJFINANCE-EQ',
        'hdfcbank': 'NSE:HDFCBANK-EQ',
        'sbin': 'NSE:SBIN-EQ',
        'axisbank': 'NSE:AXISBANK-EQ',
        'icicibank': 'NSE:ICICIBANK-EQ',
        'infy': 'NSE:INFY-EQ',
        'tcs': 'NSE:TCS-EQ',
    };

    function onmsg(message) {
        socket.emit('message', message);
    }

    function onconnect(symbols) {
        fyersdata.subscribe(symbols);
        fyersdata.autoreconnect();
    }

    function onerror(err) {
        console.error(err, handleFyersError);
    }

    function onclose(symbols) {
        console.log(`Socket closed for ${symbols}`);
    }

    fyersdata.on("message", onmsg);
    fyersdata.on("connect", onconnect);
    fyersdata.on("error", onerror);
    fyersdata.on("close", onclose);

    try {
        fyersdata.connect();
    } catch (err) {
        handleFyersError(err);
    }

    socket.on('symbol', async (userFriendlySymbol) => {
        const stockSymbol = stockSymbols[userFriendlySymbol];
        if (stockSymbol) {
            try {
                // const response = await axios.get(`http://localhost:5000/api/v3/ticker/${userFriendlySymbol}`);
                // const ltp = response.data.d[0].v.lp;
                // const roundedLTP = calculateRoundedLTP(ltp, userFriendlySymbol);
                // const totalStrikePrice = 9;
                // const strikePrices = generateStrikePrices(roundedLTP, totalStrikePrice, userFriendlySymbol);

                // const symbolsToConnect = [stockSymbol, ...strikePrices];
                onconnect(symbolsToConnect);
                // Emit response as an array
                socket.emit('Socket Emit', symbolsToConnect);

            } catch (error) {
                console.error(`InValid Symbol ${userFriendlySymbol}:`, error);
            }
        } else {
            console.log(`Invalid symbol: ${userFriendlySymbol}`);
        }
    });

    socket.on('disconnect', () => {
        const userFriendlySymbol = socket.userFriendlySymbol;
        if (userFriendlySymbol) {
            const stockSymbol = stockSymbols[userFriendlySymbol];
            onclose([stockSymbol, ...strikePrices]);
            fyersdata.unsubscribe([stockSymbol, ...strikePrices]);
        }
    });
});

// Server Up & Running
server.listen(port, () => {
    console.log(`Server Live At Port ${port}.`);
});
