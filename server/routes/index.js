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

router.get('/authorize', (req, res) => {
    const generateAuthcodeURL = fyers.generateAuthCode();
    console.log(generateAuthcodeURL);
    res.redirect(generateAuthcodeURL);
});
router.get('/authenticate', async (req, res) => {
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
router.get('/history/:symbol', async (req, res) => {
    const symbol = req.params.symbol.toLowerCase();
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
    if (!stockSymbols[symbol]) {
        return res.status(400).json({ error: 'Invalid symbol' });
    }

    const currentDate = new Date();
    const oneYearAgo = new Date(currentDate);
    oneYearAgo.setFullYear(currentDate.getFullYear() - 1);

    const data = {
        symbol: stockSymbols[symbol],
        resolution: '1D',
        date_format: '1',
        cont_flag: '1',
    };
    const chunkSize = 100;
    const numLoops = Math.ceil((currentDate - oneYearAgo) / (1000 * 60 * 60 * 24) / chunkSize);

    try {
        let historicalData = [];

        for (let i = 0; i < numLoops; i++) {
            const start = new Date(oneYearAgo.getTime() + i * chunkSize * (1000 * 60 * 60 * 24));
            const end = new Date(oneYearAgo.getTime() + (i + 1) * chunkSize * (1000 * 60 * 60 * 24));

            data.range_from = start.toISOString().split('T')[0];
            data.range_to = end.toISOString().split('T')[0];

            const response = await fyers.getHistory(data);
            historicalData = historicalData.concat(response);
        }

        // console.log(historicalData);
        res.send(historicalData);
    } catch (error) {
        handleFyersError(res, error);
    }
});
router.get('/status', (req, res) => {
    fyers.market_status().then((response) => {
        res.send(response)
    }).catch((error) => {
        console.log(error)
    })
})
router.get('/ticker/:symbol/:userdate?', async (req, res) => {``
    const validSymbols = ['nifty', 'banknifty', 'sensex', 'finnifty', 'midcpnifty', 'bankex', 'reliance', 'bajfinance', 'hdfcbank', 'sbin', 'axisbank', 'icicibank', 'infy', 'tcs'];
    const userdate = req.params.userdate;
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
    let symbolsToFetch = [];
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

    if (req.params.symbol) {
        const symbol = req.params.symbol.toLowerCase();
        if (!validSymbols.includes(symbol)) {
            return res.status(400).send('Invalid symbol');
        }
        symbolsToFetch.push(indexMapping[symbol]);
    } else {
        // If no symbol is provided, fetch data for all symbols
        symbolsToFetch = Object.values(indexMapping);
    }
    try {
        // const response = await fyers.getQuotes(symbolsToFetch);
        // res.send(response);
        var inp = {
            "symbol": symbolsToFetch,
            "resolution": "D",
            "date_format": "1",
            "range_from": formattedDate,
            "range_to": formattedDate,
            "cont_flag": "1"
        }
        fyers.getHistory(inp).then((response) => {
            res.send(response)
        }).catch((err) => {
            console.log(err)
        })
    } catch (error) {
        handleFyersError(res, error);
    }
});
router.get('/futures/:symbol', async (req, res) => {
    // console.log('/Future/Symbol is Calling');
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    function getLastThursday(year, month) {
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const dayOfWeek = lastDayOfMonth.getDay();
        const diff = (dayOfWeek + 6) % 7; // Calculate the difference to Thursday
        return new Date(lastDayOfMonth - diff * 24 * 60 * 60 * 1000);
    }

    // Get the last Thursday of the current month
    const lastThursday = getLastThursday(currentYear, currentMonth);

    const short_Year = currentDate.toLocaleDateString('en-US', { year: '2-digit' }).slice(-2);

    const futureSymbolsPattern = {
        'nifty': `NSE:NIFTY${short_Year}`,
        'banknifty': `NSE:BANKNIFTY${short_Year}`,
        'sensex': `BSE:SENSEX${short_Year}`,
        'finnifty': `NSE:FINNIFTY${short_Year}`,
        'midcpnifty': `NSE:MIDCPNIFTY${short_Year}`,
        'bankex': `BSE:BANKEX${short_Year}`,
        'reliance': `NSE:RELIANCE${short_Year}`,
        'bajfinance': `NSE:BAJFINANCE${short_Year}`,
        'hdfcbank': `NSE:HDFCBANK${short_Year}`,
        'sbin': `NSE:SBIN${short_Year}`,
        'axisbank': `NSE:AXISBANK${short_Year}`,
        'icicibank': `NSE:ICICIBANK${short_Year}`,
        'infy': `NSE:INFY${short_Year}`,
        'tcs': `NSE:TCS${short_Year}`,
    };

    const userFriendlySymbol = req.params.symbol.toLowerCase();
    const baseSymbolPattern = futureSymbolsPattern[userFriendlySymbol];

    if (!baseSymbolPattern) {
        return res.status(400).json({ error: 'Invalid user-friendly symbol' });
    }

    let currentMonthSymbol, nextMonthSymbol, monthAfterNextSymbol;

    if (currentDate.getDate() <= lastThursday.getDate()) {
        // If the current date is on or before the last Thursday of the month
        const short_Month = new Date().toLocaleString('default', { month: 'short' }).toUpperCase();
        currentMonthSymbol = `${baseSymbolPattern}${short_Month}FUT`;
        const nextMonth = new Date(currentYear, currentMonth + 1, 1);
        nextMonthSymbol = `${baseSymbolPattern}${new Date(nextMonth).toLocaleString('default', { month: 'short' }).toUpperCase()}FUT`;
        const monthAfterNext = new Date(currentYear, currentMonth + 2, 1);
        monthAfterNextSymbol = `${baseSymbolPattern}${new Date(monthAfterNext).toLocaleString('default', { month: 'short' }).toUpperCase()}FUT`;
    } else {
        // If the current date is after the last Thursday of the month
        const nextMonth = new Date(currentYear, currentMonth + 1, 1);
        currentMonthSymbol = `${baseSymbolPattern}${new Date(nextMonth).toLocaleString('default', { month: 'short' }).toUpperCase()}FUT`;
        const monthAfterNext = new Date(currentYear, currentMonth + 2, 1);
        nextMonthSymbol = `${baseSymbolPattern}${new Date(monthAfterNext).toLocaleString('default', { month: 'short' }).toUpperCase()}FUT`;
        const twoMonthsAfterNext = new Date(currentYear, currentMonth + 3, 1);
        monthAfterNextSymbol = `${baseSymbolPattern}${new Date(twoMonthsAfterNext).toLocaleString('default', { month: 'short' }).toUpperCase()}FUT`;
    }

    const threeFutureSymbols = [currentMonthSymbol, nextMonthSymbol, monthAfterNextSymbol];

    try {
        // Assuming fyers.getQuotes function is asynchronous and returns a promise
        const response = await fyers.getQuotes(threeFutureSymbols);
        res.send(response);
    } catch (error) {
        handleFyersError(res, error);
    }
});
router.get('/ltp-future/:symbol/:userdate?', async (req, res) => {
    // console.log('/ltp-future s Calling');
    const symbol = req.params.symbol.toLowerCase();
    const userdate = req.params.userdate;
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
        const response = await axios.get(`http://localhost:5000/api/v3/futures/${symbol}`);
        const index = response.data.d[0].n;
        var inp = {
            "symbol": index,
            "resolution": "1",
            "date_format": "1",
            "range_from": formattedDate,
            "range_to": formattedDate,
            "cont_flag": "1"
        }
        fyers.getHistory(inp).then((response) => {
            res.send(response)
        }).catch((err) => {
            console.log("Futures Ltp Limit Exceed")
        })
    } catch (error) {
        console.error("Error occurred:", error);
        res.status(500).send("Internal Server Error");
    }
});
function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}
module.exports = router;
