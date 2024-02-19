const express = require('express');
const router = express.Router();
const axios = require('axios');
const FyersAPI = require('fyers-api-v3');
const handleFyersError = require('.././utils/index')
require('dotenv').config()
const fyers = new FyersAPI.fyersModel();
fyers.setAppId(process.env.APP_ID);
fyers.setRedirectUrl('https://www.rgstartup.com/');
fyers.setAccessToken(process.env.ACCESS_TOKEN);
// Api Request Limit 
const { RateLimiter } = require('limiter');
const limiter = new RateLimiter({ tokensPerInterval: 10, interval: 'second' });

router.get("/index/:symbol/:userdate?", async (req, res) => {
    const userdate = req.params.userdate;
    try {
        let date;
        if (userdate) {
            date = new Date(`${userdate}`)
        } else {
            date = new Date()

        }
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0) { // Sunday
            date.setDate(date.getDate() - 2);
        } else if (dayOfWeek === 6) { // Saturday
            date.setDate(date.getDate() - 1);
        }
        const formattedDate = formatDate(date);
        // Symbol validation
        const validSymbols = ['nifty', 'banknifty', 'sensex', 'finnifty', 'midcpnifty', 'bankex', 'reliance', 'bajfinance', 'hdfcbank', 'sbin', 'axisbank', 'icicibank', 'infy', 'tcs'];
        const symbol = req.params.symbol.toLowerCase();
        if (!validSymbols.includes(symbol)) {
            return res.status(400).send('Invalid symbol');
        }

        // Index mapping
        const indexMapping = {
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
        const index = indexMapping[symbol];

        // Prepare input for fetching history
        const inp = {
            "symbol": `${index}`,
            "resolution": "1",
            "date_format": "1",
            "range_from": `${formattedDate}`,
            "range_to": `${formattedDate}`,
            "cont_flag": "1"
        };

        // Fetch history
        fyers.getHistory(inp)
            .then((response) => {
                res.send(response);
            })
            .catch((err) => {
                console.log("Request Limit Exceeded in /Records/Index");
                res.status(500).send("Api Limit React");
            });
    } catch (error) {
        console.error("Error occurred:");
        res.status(500).send("Internal Server Error");
    }
});
router.get("/ce/:symbol/:strike/:userdate?", async (req, res) => {
    const symbol = req.params.symbol.toLowerCase();
    const strike = req.params.strike;
    const userdate = req.params.userdate;
    const apiURL = `${process.env.MAIN_URL}/option-chain/single-strike/${symbol}/${strike}`;
    let date;
    if (userdate) {
        date = new Date(`${userdate}`)
    } else {
        date = new Date()

    }
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) { // Sunday
        date.setDate(date.getDate() - 2);
    } else if (dayOfWeek === 6) { // Saturday
        date.setDate(date.getDate() - 1);
    }
    const formattedDate = formatDate(date);
    try {
        await limiter.removeTokens(1); // Ensure only 10 requests per second
        const response = await axios.get(apiURL);
        const ceSymbol = response.data.d[0].n;
        var inp = {
            "symbol": `${ceSymbol}`,
            "resolution": "1",
            "date_format": "1",
            "range_from": `${formattedDate}`,
            "range_to": `${formattedDate}`,
            "cont_flag": "1"
        };
        const historyResponse = await fyers.getHistory(inp);
        res.send(historyResponse);
    } catch (error) {
        if (error.message === 'Not enough tokens') {
            console.log("API rate limit exceeded.");
            res.status(429).send("Too Many Requests");
        } else {
            console.log("Request Limit Exceeded in /Records/Ce:", error.message);
            res.status(500).send("Internal Server Error");
        }
    }
});
router.get("/pe/:symbol/:strike/:userdate?", async (req, res) => {
    const symbol = req.params.symbol.toLowerCase();
    const strike = req.params.strike.toLowerCase();
    const userdate = req.params.userdate;
    const apiURL = `${process.env.MAIN_URL}/option-chain/single-strike/${symbol}/${strike}`;
    let date;
    if (userdate) {
        date = new Date(`${userdate}`)
    } else {
        date = new Date()

    }
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) { // Sunday
        date.setDate(date.getDate() - 2);
    } else if (dayOfWeek === 6) { // Saturday
        date.setDate(date.getDate() - 1);
    }
    const formattedDate = formatDate(date);
    try {
        await limiter.removeTokens(1); // Ensure only 10 requests per second
        const response = await axios.get(apiURL);
        const peSymbol = response.data.d[1].n;
        var inp = {
            "symbol": `${peSymbol}`,
            "resolution": "1",
            "date_format": "1",
            "range_from": `${formattedDate}`,
            "range_to": `${formattedDate}`,
            "cont_flag": "1"
        };
        const historyResponse = await fyers.getHistory(inp);
        res.send(historyResponse);
    } catch (error) {
        if (error.message === 'Not enough tokens') {
            console.log("API rate limit exceeded.");
            res.status(429).send("Too Many Requests");
        } else {
            console.log("Request Limit Exceeded in /Records/Pe:", error.message);
            res.status(500).send("Internal Server Error");
        }
    }
});
// /Records page Historical data
router.get('/history/:symbol/:userdate?', async (req, res) => {
    const userdate = req.params.userdate;
    try {
        let date;
        if (userdate) {
            date = new Date(`${userdate}`)
        } else {
            date = new Date()
        }
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0) { // Sunday
            date.setDate(date.getDate() - 2);
        } else if (dayOfWeek === 6) { // Saturday
            date.setDate(date.getDate() - 1);
        }
        const formattedDate = formatDate(date);
        // Symbol validation
        const validSymbols = ['nifty', 'banknifty', 'sensex', 'finnifty', 'midcpnifty', 'bankex', 'reliance', 'bajfinance', 'hdfcbank', 'sbin', 'axisbank', 'icicibank', 'infy', 'tcs'];
        const symbol = req.params.symbol.toLowerCase();
        if (!validSymbols.includes(symbol)) {
            return res.status(400).send('Invalid symbol');
        }

        // Index mapping
        const indexMapping = {
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
        const index = indexMapping[symbol];

        // Prepare input for fetching history
        const inp = {
            "symbol": `${index}`,
            "resolution": "1",
            "date_format": "1",
            "range_from": `${formattedDate}`,
            "range_to": `${formattedDate}`,
            "cont_flag": "1"
        };

        // Fetch history
        fyers.getHistory(inp)
            .then((response) => {
                res.send(response);
            })
            .catch((err) => {
                console.log("Request Limit Exceeded in /Records/Index");
                res.status(500).send("Api Limit React");
            });
    } catch (error) {
        console.error("Error occurred:");
        res.status(500).send("Internal Server Error");
    }
})
// Function to format date as yyyy-mm-dd
function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}
module.exports = router