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

// Generates Stike prices of Symbol or of a particular date given in param
router.get('/all/:symbol/:date?', async (req, res) => {
    const validStockSymbols = ['nifty', 'banknifty', 'sensex', 'finnifty', 'midcpnifty', 'bankex', 'reliance', 'bajfinance', 'hdfcbank', 'sbin', 'axisbank', 'icicibank', 'infy', 'tcs'];
    const symbol = req.params.symbol.toLowerCase();
    const date = req.params.date;
    // console.log(typeof (date));
    if (!validStockSymbols.includes(symbol)) {
        return res.status(400).json({ "error": 'Invalid stock symbol' });
    }
    const apiUrl = `${process.env.MAIN_URL}/api/v3/ticker/${symbol}`;
    const tickerEndpoint = apiUrl;
    console.log(tickerEndpoint);
    try {
        const tickerResponse = await axios.get(tickerEndpoint);
        const ltp = tickerResponse.data.d[0].v.lp;
        const roundedLTP = calculateRoundedLTP(ltp, symbol)
        const totalStrikePrices = 4;
        const strikePrices = generateStrikePrices(roundedLTP, totalStrikePrices, symbol, date)
        const data = await fyers.getQuotes(strikePrices)
        res.send(data)
    } catch (error) {
        console.error('error');
        res.status(500).json({ "`error`": 'Error fetching last traded price' });
    }
});
// Return Array of Expiry Dates as per the Symbol
router.get('/expiry/:symbol', (req, res) => {
    const validStockSymbols = ['nifty', 'banknifty', 'sensex', 'finnifty', 'midcpnifty', 'bankex', 'reliance', 'bajfinance', 'hdfcbank', 'sbin', 'axisbank', 'icicibank', 'infy', 'tcs'];
    const symbol = req.params.symbol.toLowerCase();
    if (!validStockSymbols.includes(symbol)) {
        return res.status(400).json({ error: 'Invalid stock symbol Radhik   ' });
    }
    const expiryDates = getNextExpiryDates([symbol]);
    res.send(expiryDates)
});
// It Generate Single Strike Price Which is used by Records Api
router.get('/single-strike/:symbol/:strike', async (req, res) => {
    const validStockSymbols = ['nifty', 'banknifty', 'sensex', 'finnifty', 'midcpnifty', 'bankex', 'reliance', 'bajfinance', 'hdfcbank', 'sbin', 'axisbank', 'icicibank', 'infy', 'tcs'];
    const symbol = req.params.symbol.toLowerCase();
    const strike = req.params.strike.toLowerCase();

    if (!validStockSymbols.includes(symbol)) {
        return res.status(400).json({ error: 'Invalid stock symbol' });
    }
    const roundedLTP = calculateRoundedLTP(strike, symbol)
    const totalStrikePrices = 0;
    const strikePrices = generateStrikePricesSingle(roundedLTP, totalStrikePrices, symbol)
    const data = await fyers.getQuotes(strikePrices)
    res.send(data)
});
// It Generates Numerics Strikes
router.get('/strikes/:symbol', async (req, res) => {
    const validStockSymbols = ['nifty', 'banknifty', 'sensex', 'finnifty', 'midcpnifty', 'bankex', 'reliance', 'bajfinance', 'hdfcbank', 'sbin', 'axisbank', 'icicibank', 'infy', 'tcs'];
    const symbol = req.params.symbol.toLowerCase();
    if (!validStockSymbols.includes(symbol)) {
        return res.status(400).json({ error: 'Invalid stock symbol' });
    }
    const tickerEndpoint = `${process.env.MAIN_URL}/api/v3/ticker/${symbol}`;
    try {
        const tickerResponse = await axios.get(tickerEndpoint);
        const ltp = tickerResponse.data.d[0].v.lp;
        const roundedLTP = calculateRoundedLTP(ltp, symbol);
        const totalStrikePrices = 4;
        const strikePrices = generateStrikePricesNumeric(roundedLTP, totalStrikePrices, symbol);
        res.json(strikePrices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching last traded price' });
    }
});
// Generate next Expiry Dates
function getNextExpiryDates(symbols) {
    const today = new Date("09-Feb-2024");
    const expiryDates = [];

    function getNextWeekday(date, dayIndex) {
        const result = new Date(date);
        result.setDate(date.getDate() + (dayIndex + 7 - date.getDay()) % 7);
        return { month: result.toLocaleString('default', { month: 'short' }), day: result.getDate() };
    }

    for (const symbol of symbols) {
        let month, day;
        switch (symbol.toLowerCase()) {
            case 'nifty':
                ({ month, day } = getNextWeekday(today, 4));
                break;
            case 'banknifty':
                ({ month, day } = getNextWeekday(today, 3));
                break;
            case 'finnifty':
                ({ month, day } = getNextWeekday(today, 2));
                break;
            case 'midcpnifty':
                ({ month, day } = getNextWeekday(today, 1));
                break;
            case 'sensex':
                ({ month, day } = getNextWeekday(today, 5));
                break;
            case 'bankex':
                ({ month, day } = getNextWeekday(today, 1));
                break;
            default:
                const lastThursdays = [];
                const currentMonth = today.getMonth();
                for (let i = 0; i < 5; i++) {
                    const nextMonth = new Date(today.getFullYear(), currentMonth + i, 1);
                    const lastDayOfMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
                    const lastThursday = new Date(lastDayOfMonth);
                    lastThursday.setDate(lastDayOfMonth.getDate() - (lastDayOfMonth.getDay() + 7 - 4) % 7);
                    if (today <= lastThursday) {
                        lastThursdays.push(`${lastThursday.getDate()}-${lastThursday.toLocaleString('default', { month: 'short' })}-${lastThursday.getFullYear()}`);
                    } else {
                        const nextThursday = new Date(lastThursday);
                        nextThursday.setDate(nextThursday.getDate() + 7);
                        lastThursdays.push(`${nextThursday.getDate()}-${nextThursday.toLocaleString('default', { month: 'short' })}-${nextThursday.getFullYear()}`);
                    }
                }
                expiryDates.push(lastThursdays);
                continue; // Skip to the next symbol
        }

        const symbolExpiryDates = [];
        for (let i = 0; i < 5; i++) {
            const expiryDate = new Date(today.getFullYear(), today.getMonth(), day + (i * 7));
            symbolExpiryDates.push(`${expiryDate.getDate()}-${expiryDate.toLocaleString('default', { month: 'short' })}-${expiryDate.getFullYear()}`);
        }

        expiryDates.push(symbolExpiryDates);
    }

    return expiryDates;
}
// Calculate Rounded LTP based on symbol
function calculateRoundedLTP(ltp, symbol) {
    let gap;
    if (ltp && symbol) {
        if (symbol === 'nifty' || symbol === 'finnifty' || symbol === 'bajfinance') {
            gap = 50;
        } else if (symbol === 'banknifty' || symbol === 'sensex' || symbol === 'bankex') {
            gap = 100;
        } else if (symbol === 'midcpnifty') {
            gap = 25;
        } else if (symbol === 'reliance' || symbol === "tcs") {
            gap = 20;
        } else if (symbol === 'hdfcbank' || symbol === "infy") {
            gap = 10;

        } else if (symbol === 'sbin' || symbol === 'axisbank' || symbol === 'icicibank') {
            gap = 5;
        }
    } else {
        gap = 10000;
    }
    return Math.round(ltp / gap) * gap;
}
function generateStrikePrices(roundLTP, totalStrikePrices, symbol, date = '') {
    const strikePricesCE = [];
    const strikePricesPE = [];
    const numStrikesBefore = totalStrikePrices;
    const numStrikesAfter = totalStrikePrices;
    function getNextWeekday(date, dayIndex) {
        const daysUntilNextWeekday = (dayIndex - date.getDay() + 7) % 7;
        const nextWeekday = new Date(date);
        nextWeekday.setDate(date.getDate() + daysUntilNextWeekday);

        const month = (nextWeekday.getMonth() + 1).toString().padStart(2, '0');
        const day = nextWeekday.getDate().toString().padStart(2, '0');
        return { month, day };
    }
    function getLastWeekdayOfMonth(date, dayIndex) {
        const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const lastDayOfWeek = lastDayOfMonth.getDay(); // Day of the week of the last day of the month
        let daysUntilLastWeekday = dayIndex - lastDayOfWeek;
        if (daysUntilLastWeekday > 0) {
            daysUntilLastWeekday -= 7; // Adjust if the target day is after the last day of the month
        }
        const lastWeekday = new Date(lastDayOfMonth);
        lastWeekday.setDate(lastDayOfMonth.getDate() + daysUntilLastWeekday);

        const month = (lastWeekday.getMonth() + 1).toString().padStart(2, '0');
        const day = lastWeekday.getDate().toString().padStart(2, '0');

        return { month, day };
    }
    function shortMonthToNumeric(shortMonth) {
        const monthMap = {
            'JAN': 1,
            'FEB': 2,
            'MAR': 3,
            'APR': 4,
            'MAY': 5,
            'JUN': 6,
            'JUL': 7,
            'AUG': 8,
            'SEP': 9,
            'OCT': 10,
            'NOV': 11,
            'DEC': 12
        };
        const uppercaseMonth = shortMonth.toUpperCase();
        return monthMap[uppercaseMonth] || null;
    }
    const symbolConfig = {
        'nifty': 50,
        'finnifty': 50,
        'bajfinance': 50,
        'banknifty': 100,
        'sensex': 100,
        'bankex': 100,
        'midcpnifty': 25,
        'reliance': 20,
        'tcs': 20,
        'hdfcbank': 10,
        'infy': 10,
        'sbin': 5,
        'axisbank': 10,
        'icicibank': 5
    };

    const gap = symbolConfig[symbol]
    const currentDate = new Date();

    let day, month, year, alpaMonth;

    if (date !== '' && symbol) {
        switch (symbol) {
            case 'nifty':
                ({ month, day } = getLastWeekdayOfMonth(currentDate, 4))
                break;
            case 'banknifty':
                ({ month, day } = getLastWeekdayOfMonth(currentDate, 3))
                break;
            case 'finnifty':
                ({ month, day } = getLastWeekdayOfMonth(currentDate, 2))
                break;
            case 'midcpnifty':
                ({ month, day } = getLastWeekdayOfMonth(currentDate, 1))
                break;
            case 'sensex':
                ({ month, day } = getLastWeekdayOfMonth(currentDate, 5))
                break;
            case 'bankex':
                ({ month, day } = getLastWeekdayOfMonth(currentDate, 1))
                break;
            default:
                ({ month, day } = getLastWeekdayOfMonth(currentDate, 4))
                break;
        }
        const [inputDay, inputMonth, inputYear] = date.split('-');
        const UserInputday = inputDay.padStart(2, '0');
        const monthTypeString = Number(new Date(Date.parse(inputMonth + ' 1, 2000')).getMonth() + 1).toString().padStart(2, '0');
        const UserInputMonth = Number(monthTypeString);
        const UserInputYear = inputYear.slice(-2);
        // console.log(UserInputday,UserInputMonth,UserInputYear);
        if (UserInputday === day) {
            day = 69;
            year = UserInputYear;
            month = shortMonthToNumeric(UserInputMonth)
            alpaMonth = shortMonthToNumeric(UserInputMonth)
        } else {
            day =UserInputday;
            year = Number(UserInputYear);
            month = UserInputMonth;
        }
    } else {
        switch (symbol) {
            case 'nifty':
                ({ month, day } = getNextWeekday(currentDate, 4))
                break;
            case 'banknifty':
                ({ month, day } = getNextWeekday(currentDate, 3))
                break;
            case 'finnifty':
                ({ month, day } = getNextWeekday(currentDate, 2))
                break;
            case 'midcpnifty':
                ({ month, day } = getNextWeekday(currentDate, 1))
                break;
            case 'sensex':
                ({ month, day } = getNextWeekday(currentDate, 5))
                break;
            case 'bankex':
                ({ month, day } = getNextWeekday(currentDate, 1))
                break;
            default:
                alpaMonth = new Date().toLocaleString('default', { month: 'short' }).toUpperCase();
                day = 69
                break;
        }
    }
console.log(day,month,year);
    let monthShort;

    if (month >= 1 && month <= 9) {
        monthShort = month.toString().slice(-1);
    } else if (month === 10) {
        monthShort = 'O';
    } else if (month === 11) {
        monthShort = 'N';
    } else if (month === 12) {
        monthShort = 'D';
    } else if (month === alpaMonth) {
        monthShort = alpaMonth
    } else {
        monthShort = alpaMonth;
    }

    const yearShort = year || currentDate.toLocaleDateString('en-US', { year: '2-digit' }).slice(-2);

    if (totalStrikePrices != 0) {
        for (let i = -numStrikesBefore; i <= numStrikesAfter; i++) {
            const strikePrice = roundLTP + i * gap;
            const formattedSymbolCE = `${symbol === 'sensex' || symbol === 'bankex' ? 'BSE' : 'NSE'}:${symbol.toUpperCase()}${yearShort}${monthShort}${day === 69 ? '' : day}${strikePrice}CE`;
            const formattedSymbolPE = `${symbol === 'sensex' || symbol === 'bankex' ? 'BSE' : 'NSE'}:${symbol.toUpperCase()}${yearShort}${monthShort}${day === 69 ? '' : day}${strikePrice}PE`;

            strikePricesCE.push(formattedSymbolCE);
            strikePricesPE.push(formattedSymbolPE);
        }
    }
    return [strikePricesCE, strikePricesPE];
}

function generateStrikePricesSingle(roundLTP, totalStrikePrices, symbol) {
    const strikePricesCE = [];
    const strikePricesPE = [];
    const numStrikesBefore = totalStrikePrices;
    const numStrikesAfter = totalStrikePrices;
    function getNextWeekday(date, dayIndex) {
        const daysUntilNextWeekday = (dayIndex - date.getDay() + 7) % 7;
        const nextWeekday = new Date(date);
        nextWeekday.setDate(date.getDate() + daysUntilNextWeekday);

        const month = (nextWeekday.getMonth() + 1).toString().padStart(2, '0');
        const day = nextWeekday.getDate().toString().padStart(2, '0');

        return { month, day };
    }
    // function getLastWeekdayOfMonth(date, dayIndex) {
    //     const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    //     const lastWeekdayOfMonth = new Date(lastDayOfMonth);
    //     lastWeekdayOfMonth.setDate(lastDayOfMonth.getDate() - ((lastDayOfMonth.getDay() + 6 - dayIndex) % 7));
    //     return lastWeekdayOfMonth;
    // }
    const symbolConfig = {
        'nifty': 50,
        'finnifty': 50,
        'bajfinance': 50,
        'banknifty': 100,
        'sensex': 100,
        'bankex': 100,
        'midcpnifty': 25,
        'reliance': 20,
        'tcs': 20,
        'hdfcbank': 10,
        'infy': 10,
        'sbin': 5,
        'axisbank': 10,
        'icicibank': 5
    };
    const gap = symbolConfig[symbol];
    const currentDate = new Date();
    let day, month, alpaMonth // *Day is nothing just a Expiry Dat
    switch (symbol) {
        case 'nifty':
            ({ month, day } = getNextWeekday(currentDate, 4))
            break;
        case 'banknifty':
            ({ month, day } = getNextWeekday(currentDate, 3))
            break;
        case 'finnifty':
            ({ month, day } = getNextWeekday(currentDate, 2))
            break;
        case 'midcpnifty':
            ({ month, day } = getNextWeekday(currentDate, 1))
            break;
        case 'sensex':
            ({ month, day } = getNextWeekday(currentDate, 5))
            break;
        case 'bankex':
            ({ month, day } = getNextWeekday(currentDate, 1))
            break;
        default:
            alpaMonth = new Date().toLocaleString('default', { month: 'short' }).toUpperCase();

            day = 69
            break;
    }
    let monthShort;

    if (month >= 1 && month <= 9) {
        monthShort = month.toString().slice(-1);
    } else if (month === 10) {
        monthShort = 'O';
    } else if (month === 11) {
        monthShort = 'N';
    } else if (month === 12) {
        monthShort = 'D';
    } else {
        monthShort = alpaMonth;
    }
    const yearShort = currentDate.toLocaleDateString('en-US', { year: '2-digit' }).slice(-2);
    if (totalStrikePrices != 0) {

    }
    for (let i = -numStrikesBefore; i <= numStrikesAfter; i++) {
        const strikePrice = roundLTP + i * gap;
        const formattedSymbolCE = `${symbol === 'sensex' || symbol === 'bankex' ? 'BSE' : 'NSE'}:${symbol.toUpperCase()}${yearShort}${monthShort}${day === 69 ? '' : day}${strikePrice}CE`;
        const formattedSymbolPE = `${symbol === 'sensex' || symbol === 'bankex' ? 'BSE' : 'NSE'}:${symbol.toUpperCase()}${yearShort}${monthShort}${day === 69 ? '' : day}${strikePrice}PE`;

        strikePricesCE.push(formattedSymbolCE);
        strikePricesPE.push(formattedSymbolPE);
    }
    return [strikePricesCE, strikePricesPE];
}
// Generate Strike Price in Numeric
function generateStrikePricesNumeric(roundLTP, totalStrikePrices, symbol) {
    const strikePrices = [];
    const numStrikesBefore = totalStrikePrices;
    const numStrikesAfter = totalStrikePrices;

    let gap;

    if (symbol === 'nifty' || symbol === 'finnifty' || symbol === 'bajfinance') {
        gap = 50;
    } else if (symbol === 'banknifty' || symbol === 'sensex' || symbol === 'bankex') {
        gap = 100;
    } else if (symbol === 'midcpnifty') {
        gap = 25;
    } else if (symbol === 'reliance' || symbol === "tcs") {
        gap = 20;
    } else if (symbol === 'hdfcbank' || symbol === "infy" || symbol === 'axisbank') {
        gap = 10;
    } else if (symbol === 'sbin' || symbol === 'icicibank') {
        gap = 5;
    }

    for (let i = -numStrikesBefore; i <= numStrikesAfter; i++) {
        const strikePrice = roundLTP + i * gap;
        strikePrices.push(strikePrice);
    }

    return strikePrices;
}

module.exports = router;
