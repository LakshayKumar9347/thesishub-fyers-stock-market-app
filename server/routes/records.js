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
    // const date = new Date();
    // const marketStatusResponse = await fetch(`${process.env.MAIN_URL}/api/v3/status`);
    // const marketStatusData = await marketStatusResponse.json();
    // const marketStatus = marketStatusData.marketStatus[0].status;

    // // POSTCLOSE_CLOSED or CLOSED
    // if (marketStatus === 'CLOSED' || marketStatus === 'POSTCLOSE_CLOSED') {
    //     date.setDate(date.getDate() - 1); // Adjust the date accordingly
    // }

    const currentDate = new Date("2024-02-09");
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const day = currentDate.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const validSymbols = ['nifty', 'banknifty', 'sensex', 'finnifty', 'midcpnifty', 'bankex', 'reliance', 'bajfinance', 'hdfcbank', 'sbin', 'axisbank', 'icicibank', 'infy', 'tcs'];

    const symbol = req.params.symbol.toLowerCase();
    if (!validSymbols.includes(symbol)) {
        return res.status(400).send('Invalid symbol');
    }
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
    const index = [indexMapping[symbol]];

    var inp = {
        "symbol": `${index}`,
        "resolution": "1",
        "date_format": "1",
        "range_from": `${formattedDate}`,
        "range_to": `${formattedDate}`,
        "cont_flag": "1"
    }
    fyers.getHistory(inp).then((response) => {
        res.send(response);
    }).catch((err) => {
        console.log("Error Occurred In Data Records:"); // Log the actual error message
        res.status(500).send("Error Occurred In Data Records"); // Send a 500 status response to indicate server error
    });

})




router.get("/ce/:symbol/:strike", async (req, res) => {
    const symbol = req.params.symbol.toLowerCase();
    const strike = req.params.strike;
    const apiURL = `${process.env.MAIN_URL}/option-chain/single-strike/${symbol}/${strike}`;
    const date = new Date();
    const marketStatusResponse = await fetch(`${process.env.MAIN_URL}/api/v3/status`);
    const marketStatusData = await marketStatusResponse.json();
    const marketStatus = marketStatusData.marketStatus[0].status;
    // POSTCLOSE_CLOSED or CLOSED
    if (marketStatus === 'CLOSED' || marketStatus === 'POSTCLOSE_CLOSED') {
        date.setDate(date.getDate() - 1); // Adjust the date accordingly
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
            console.log("Error Fetching CE Records", err)
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
    const marketStatusResponse = await fetch(`${process.env.MAIN_URL}/api/v3/status`);
    const marketStatusData = await marketStatusResponse.json();
    const marketStatus = marketStatusData.marketStatus[0].status;
    // POSTCLOSE_CLOSED or CLOSED
    if (marketStatus === 'CLOSED' || marketStatus === 'POSTCLOSE_CLOSED') {
        date.setDate(date.getDate() - 1); // Adjust the date accordingly
    }
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
            console.log("Error Fetching PE Records", err)
        })
    } catch (error) {
        console.log("Error Fetching Single Option-Chain Data", error)
    }
})

module.exports = router