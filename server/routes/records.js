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

router.get("/index/:symbol", async (req, res) => {
    try {
        let date = new Date();
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

// Function to format date as yyyy-mm-dd
function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

router.get("/ce/:symbol/:strike", async (req, res) => {
    const symbol = req.params.symbol.toLowerCase();
    const strike = req.params.strike;
    const apiURL = `${process.env.MAIN_URL}/option-chain/single-strike/${symbol}/${strike}`;
    const date = new Date();
    const dayOfWeek = date.getDay();

    // If it's Saturday or Sunday, adjust the date to previous Friday
    if (dayOfWeek === 0) { // Sunday
        date.setDate(date.getDate() - 2);
    } else if (dayOfWeek === 6) { // Saturday
        date.setDate(date.getDate() - 1);
    }
    const currentDate = date;
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const day = currentDate.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    try {
        const response = await axios.get(apiURL);
        const ceSymbol = response.data.d[0].n
        var inp = {
            "symbol": `${ceSymbol}`,
            "resolution": "1",
            "date_format": "1",
            "range_from": `${formattedDate}`,
            "range_to": `${formattedDate}`,
            "cont_flag": "1"
        }
        fyers.getHistory(inp).then((response) => {
            res.send(response)
        }).catch((err) => {
            console.log("Request Limit Exceeded in /Records/Ce")
            res.status(500).send("Api Limit React");
        })
    } catch (error) {
        console.log("Error Fetching Single Option-Chain Data")
    }
})

router.get("/pe/:symbol/:strike", async (req, res) => {
    const symbol = req.params.symbol.toLowerCase();
    const strike = req.params.strike.toLowerCase();
    const apiURL = `${process.env.MAIN_URL}/option-chain/single-strike/${symbol}/${strike}`;
    const date = new Date();
    const dayOfWeek = date.getDay();

    // If it's Saturday or Sunday, adjust the date to previous Friday
    if (dayOfWeek === 0) { // Sunday
        date.setDate(date.getDate() - 2);
    } else if (dayOfWeek === 6) { // Saturday
        date.setDate(date.getDate() - 1);
    }
    // const marketStatusResponse = await fetch(`${process.env.MAIN_URL}/api/v3/status`);
    // const marketStatusData = await marketStatusResponse.json();
    // const marketStatus = marketStatusData.marketStatus[0].status;
    // if (marketStatus === 'CLOSED' || marketStatus === 'POSTCLOSE_CLOSED') {
    //     date.setDate(date.getDate() - 1); // Adjust the date accordingly
    // }
    const currentDate = date;
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const day = currentDate.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    try {
        const response = await axios.get(apiURL);
        const peSymbol = response.data.d[1].n
        var inp = {
            "symbol": `${peSymbol}`,
            "resolution": "1",
            "date_format": "1",
            "range_from": `${formattedDate}`,
            "range_to": `${formattedDate}`,
            "cont_flag": "1"
        }
        fyers.getHistory(inp).then((response) => {
            res.send(response)
        }).catch((err) => {
            console.log("Request Limit Exceeded in /Records/PE")
        })
    } catch (error) {
        console.log("Error Fetching Single Option-Chain Data", error)
        res.status(500).send("Api Limit React");
    }
})

module.exports = router