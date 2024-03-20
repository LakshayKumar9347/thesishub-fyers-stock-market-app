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


    if (!validStockSymbols.includes(symbol)) {
        return res.status(400).json({ "error": 'Invalid stock symbol' });
    }
    const apiUrl = `${process.env.MAIN_URL}/api/v3/ticker/${symbol}`;
    const tickerEndpoint = apiUrl;
    try {
        const tickerResponse = await axios.get(tickerEndpoint);
        const ltp = tickerResponse.data.candles[0][4];
        const roundedLTP = calculateRoundedLTP(ltp, symbol)
        const totalStrikePrices = 4;
        const strikePrices = generateStrikePrices(roundedLTP, totalStrikePrices, symbol, date)
        const data = await fyers.getQuotes(strikePrices)
        res.send(data)
    } catch (error) {
        console.error('Error in Requesting String Prices');
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
router.get('/strikes/:symbol/:userdate?', async (req, res) => {
    const symbol = req.params.symbol.toLowerCase();
    const userdate = req.params.userdate;
    const validStockSymbols = ['nifty', 'banknifty', 'sensex', 'finnifty', 'midcpnifty', 'bankex', 'reliance', 'bajfinance', 'hdfcbank', 'sbin', 'axisbank', 'icicibank', 'infy', 'tcs'];
    if (!validStockSymbols.includes(symbol)) {
        return res.status(400).json({ error: 'Invalid stock symbol' });
    }
    let date, tickerEndpoint;
    if (userdate) {
        date = new Date(`${userdate}`)
        const formattedDate = formatDate(date);
        tickerEndpoint = `${process.env.MAIN_URL}/api/v3/ticker/${symbol}/${formattedDate}`
    } else {
        date = new Date()
        tickerEndpoint = `${process.env.MAIN_URL}/api/v3/price/${symbol}`
    }
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) { // Sunday
        date.setDate(date.getDate() - 2);
    } else if (dayOfWeek === 6) { // Saturday
        date.setDate(date.getDate() - 1);
    }

    try {
        let ltp;
        const tickerResponse = await axios.get(tickerEndpoint);
        if (userdate) {
            ltp = tickerResponse.data.candles[0][4];
        } else {
            ltp = tickerResponse.data.d[0].v.lp;
        }
        const roundedLTP = calculateRoundedLTP(ltp, symbol);
        const totalStrikePrices = 4;
        const strikePrices = generateStrikePricesNumeric(roundedLTP, totalStrikePrices, symbol);
        res.json(strikePrices);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching last traded price' });
    }
});

// Generate next Expiry Dates
function getNextExpiryDates(symbols) {
    const today = new Date();
    const expiryDates = [];

    function getNextWeekday(date, dayIndex) {
        const result = new Date(date);
        result.setDate(date.getDate() + (dayIndex + 7 - date.getDay()) % 7);
        const month = result.toLocaleString('default', { month: 'short' });
        const day = result.getDate().toString().padStart(2, '0');
        return { month, day };
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
                const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                for (let i = 0; i < 5; i++) {
                    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i, 1);
                    const lastDayOfMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
                    const lastThursday = new Date(lastDayOfMonth);
                    lastThursday.setDate(lastDayOfMonth.getDate() - (lastDayOfMonth.getDay() + 7 - 4) % 7);
                    lastThursdays.push(`${lastThursday.getDate()}-${lastThursday.toLocaleString('default', { month: 'short' })}-${lastThursday.getFullYear()}`);
                }
                expiryDates.push(lastThursdays);
                continue;
        }

        const symbolExpiryDates = [];
        for (let i = 0; i < 5; i++) {
            const expiryDateCurrentMonth = new Date(today.getFullYear(), today.getMonth(), parseInt(day) + (i * 7)); // ParseInt to avoid treating as octal if day starts with '0'
            const dayWithLeadingZeroCurrentMonth = expiryDateCurrentMonth.getDate().toString().padStart(2, '0'); // Ensure day is two digits with leading zeros
            const monthCurrentMonth = expiryDateCurrentMonth.toLocaleString('default', { month: 'short' });
            symbolExpiryDates.push(`${dayWithLeadingZeroCurrentMonth}-${monthCurrentMonth}-${expiryDateCurrentMonth.getFullYear()}`);
        }
        // const expiryDateNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, parseInt(day));
        // const dayWithLeadingZeroNextMonth = expiryDateNextMonth.getDate().toString().padStart(2, '0');
        // const monthNextMonth = expiryDateNextMonth.toLocaleString('default', { month: 'short' });
        // console.log(symbolExpiryDates);
        // symbolExpiryDates.push(`${dayWithLeadingZeroNextMonth}-${monthNextMonth}-${expiryDateNextMonth.getFullYear()}`);
        expiryDates.push(symbolExpiryDates);
    }
    return expiryDates;
}
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
        } else if (symbol === 'hdfcbank' || symbol === "infy" || symbol === 'axisbank' || symbol === 'icicibank') {
            gap = 10;

        } else if (symbol === 'sbin' ) {
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

        const month = Number((nextWeekday.getMonth() + 1).toString().padStart(2, '0'));
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

        const month = Number((lastWeekday.getMonth() + 1).toString().padStart(2, '0'));
        const day = lastWeekday.getDate().toString().padStart(2, '0');

        return { month, day };
    }
    function numericToShortMonth(numericMonth) {
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const index = numericMonth - 1;
        if (index >= 0 && index < months.length) {
            return months[index];
        } else {
            return "Invalid month";
        }
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
        'icicibank': 10
    };
    const gap = symbolConfig[symbol]

    let currentDate;
    let day, month, year, alpaMonth;
    let nextWeekdayResult, lastWeekdayOfMonthResult;

    if (date !== '' && symbol) {
        currentDate = new Date(date)
        switch (symbol) {
            case 'nifty':
                ({ month, day } = getLastWeekdayOfMonth(currentDate, 4));
                break;
            case 'banknifty':
                ({ month, day } = getLastWeekdayOfMonth(currentDate, 3));
                break;
            case 'finnifty':
                ({ month, day } = getLastWeekdayOfMonth(currentDate, 2));
                break;
            case 'midcpnifty':
                ({ month, day } = getLastWeekdayOfMonth(currentDate, 1));
                break;
            case 'sensex':
                ({ month, day } = getLastWeekdayOfMonth(currentDate, 5));
                break;
            case 'bankex':
                ({ month, day } = getLastWeekdayOfMonth(currentDate, 1));
                break;
            default:
                ({ month, day } = getLastWeekdayOfMonth(currentDate, 4));
                alpaMonth = currentDate.toLocaleString('default', { month: 'short' }).toUpperCase();
                break;
        }


        const [inputDay, inputMonth, inputYear] = date.split('-');
        const UserInputday = inputDay.padStart(2, '0');
        const UserInputMonth = Number((new Date(Date.parse(`${inputMonth} 1, 2000`)).getMonth() + 1).toString().padStart(2, '0'));
        const UserInputYear = Number(inputYear.slice(-2));
        // console.log(inputDay, inputMonth, inputYear);
        if (UserInputday === day) {
            day = 69;
            year = UserInputYear;
            month = numericToShortMonth(UserInputMonth);
            alpaMonth = numericToShortMonth(UserInputMonth);
        } else {
            day = UserInputday;
            year = UserInputYear;
            month = UserInputMonth;
        }
    } else {
        currentDate = new Date()
        switch (symbol) {
            case 'nifty':
                nextWeekdayResult = getNextWeekday(currentDate, 4);
                lastWeekdayOfMonthResult = getLastWeekdayOfMonth(currentDate, 4);
                if ((nextWeekdayResult.day === lastWeekdayOfMonthResult.day) && (nextWeekdayResult.month === lastWeekdayOfMonthResult.month)) {
                    month = numericToShortMonth(nextWeekdayResult.month)
                    alpaMonth = numericToShortMonth(nextWeekdayResult.month)
                    day = 69
                } else {
                    ({ month, day } = getNextWeekday(currentDate, 4));
                }
                break;
            case 'banknifty':
                nextWeekdayResult = getNextWeekday(currentDate, 3);
                lastWeekdayOfMonthResult = getLastWeekdayOfMonth(currentDate, 3);
                if ((nextWeekdayResult.day === lastWeekdayOfMonthResult.day) && (nextWeekdayResult.month === lastWeekdayOfMonthResult.month)) {
                    month = numericToShortMonth(nextWeekdayResult.month)
                    alpaMonth = numericToShortMonth(nextWeekdayResult.month)
                    day = 69
                } else {
                    ({ month, day } = getNextWeekday(currentDate, 3));
                }
                break;
            case 'finnifty':
                nextWeekdayResult = getNextWeekday(currentDate, 2);
                lastWeekdayOfMonthResult = getLastWeekdayOfMonth(currentDate, 2);
                if ((nextWeekdayResult.day === lastWeekdayOfMonthResult.day) && (nextWeekdayResult.month === lastWeekdayOfMonthResult.month)) {
                    month = numericToShortMonth(nextWeekdayResult.month)
                    alpaMonth = numericToShortMonth(nextWeekdayResult.month)
                    day = 69
                } else {
                    ({ month, day } = getNextWeekday(currentDate, 2));
                }
                break;
            case 'midcpnifty':
                nextWeekdayResult = getNextWeekday(currentDate, 1);
                lastWeekdayOfMonthResult = getLastWeekdayOfMonth(currentDate, 1);
                if ((nextWeekdayResult.day === lastWeekdayOfMonthResult.day) && (nextWeekdayResult.month === lastWeekdayOfMonthResult.month)) {
                    month = numericToShortMonth(nextWeekdayResult.month)
                    alpaMonth = numericToShortMonth(nextWeekdayResult.month)
                    day = 69
                } else {
                    ({ month, day } = getNextWeekday(currentDate, 1));
                }
                break;
            case 'sensex':
                nextWeekdayResult = getNextWeekday(currentDate, 5);
                lastWeekdayOfMonthResult = getLastWeekdayOfMonth(currentDate, 5);
                if ((nextWeekdayResult.day === lastWeekdayOfMonthResult.day) && (nextWeekdayResult.month === lastWeekdayOfMonthResult.month)) {
                    month = numericToShortMonth(nextWeekdayResult.month)
                    alpaMonth = numericToShortMonth(nextWeekdayResult.month)
                    day = 69
                } else {
                    ({ month, day } = getNextWeekday(currentDate, 5));
                }
                break;
            case 'bankex':
                nextWeekdayResult = getNextWeekday(currentDate, 1);
                lastWeekdayOfMonthResult = getLastWeekdayOfMonth(currentDate, 1);
                if ((nextWeekdayResult.day === lastWeekdayOfMonthResult.day) && (nextWeekdayResult.month === lastWeekdayOfMonthResult.month)) {
                    month = numericToShortMonth(nextWeekdayResult.month)
                    alpaMonth = numericToShortMonth(nextWeekdayResult.month)
                    day = 69
                } else {
                    ({ month, day } = getNextWeekday(currentDate, 1));
                }
                break;
            default:
                alpaMonth = new Date().toLocaleString('default', { month: 'short' }).toUpperCase();
                day = 69
                break;

        }
        // console.log(month, day);
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

        const month = Number((nextWeekday.getMonth() + 1).toString().padStart(2, '0'));
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

        const month = Number((lastWeekday.getMonth() + 1).toString().padStart(2, '0'));
        const day = lastWeekday.getDate().toString().padStart(2, '0');

        return { month, day };
    }
    function numericToShortMonth(numericMonth) {
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const index = numericMonth - 1;
        if (index >= 0 && index < months.length) {
            return months[index];
        } else {
            return "Invalid month";
        }
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
        'icicibank': 10
    };
    const gap = symbolConfig[symbol];
    const currentDate = new Date();
    let day, month, alpaMonth
    let nextWeekdayResult, lastWeekdayOfMonthResult;

    switch (symbol) {
        case 'nifty':
            nextWeekdayResult = getNextWeekday(currentDate, 4);
            lastWeekdayOfMonthResult = getLastWeekdayOfMonth(currentDate, 4);
            if ((nextWeekdayResult.day === lastWeekdayOfMonthResult.day) && (nextWeekdayResult.month === lastWeekdayOfMonthResult.month)) {
                month = numericToShortMonth(nextWeekdayResult.month)
                alpaMonth = numericToShortMonth(nextWeekdayResult.month)
                day = 69
            } else {
                ({ month, day } = getNextWeekday(currentDate, 4));
            }
            break;
        case 'banknifty':
            nextWeekdayResult = getNextWeekday(currentDate, 3);
            lastWeekdayOfMonthResult = getLastWeekdayOfMonth(currentDate, 3);
            if ((nextWeekdayResult.day === lastWeekdayOfMonthResult.day) && (nextWeekdayResult.month === lastWeekdayOfMonthResult.month)) {
                month = numericToShortMonth(nextWeekdayResult.month)
                alpaMonth = numericToShortMonth(nextWeekdayResult.month)
                day = 69
            } else {
                ({ month, day } = getNextWeekday(currentDate, 3));
            }
            break;
        case 'finnifty':
            nextWeekdayResult = getNextWeekday(currentDate, 2);
            lastWeekdayOfMonthResult = getLastWeekdayOfMonth(currentDate, 2);
            if ((nextWeekdayResult.day === lastWeekdayOfMonthResult.day) && (nextWeekdayResult.month === lastWeekdayOfMonthResult.month)) {
                month = numericToShortMonth(nextWeekdayResult.month)
                alpaMonth = numericToShortMonth(nextWeekdayResult.month)
                day = 69
            } else {
                ({ month, day } = getNextWeekday(currentDate, 2));
            }
            break;
        case 'midcpnifty':
            nextWeekdayResult = getNextWeekday(currentDate, 1);
            lastWeekdayOfMonthResult = getLastWeekdayOfMonth(currentDate, 1);
            if ((nextWeekdayResult.day === lastWeekdayOfMonthResult.day) && (nextWeekdayResult.month === lastWeekdayOfMonthResult.month)) {
                month = numericToShortMonth(nextWeekdayResult.month)
                alpaMonth = numericToShortMonth(nextWeekdayResult.month)
                day = 69
            } else {
                ({ month, day } = getNextWeekday(currentDate, 1));
            }
            break;
        case 'sensex':
            nextWeekdayResult = getNextWeekday(currentDate, 5);
            lastWeekdayOfMonthResult = getLastWeekdayOfMonth(currentDate, 5);
            if ((nextWeekdayResult.day === lastWeekdayOfMonthResult.day) && (nextWeekdayResult.month === lastWeekdayOfMonthResult.month)) {
                month = numericToShortMonth(nextWeekdayResult.month)
                alpaMonth = numericToShortMonth(nextWeekdayResult.month)
                day = 69
            } else {
                ({ month, day } = getNextWeekday(currentDate, 5));
            }
            break;
        case 'bankex':
            nextWeekdayResult = getNextWeekday(currentDate, 1);
            lastWeekdayOfMonthResult = getLastWeekdayOfMonth(currentDate, 1);
            if ((nextWeekdayResult.day === lastWeekdayOfMonthResult.day) && (nextWeekdayResult.month === lastWeekdayOfMonthResult.month)) {
                month = numericToShortMonth(nextWeekdayResult.month)
                alpaMonth = numericToShortMonth(nextWeekdayResult.month)
                day = 69
            } else {
                ({ month, day } = getNextWeekday(currentDate, 1));
            }
            break;
        default:
            alpaMonth = new Date().toLocaleString('default', { month: 'short' }).toUpperCase();
            day = 69
            break;
    }
    // switch (symbol) {
    //     case 'nifty':
    //         ({ month, day } = getNextWeekday(currentDate, 4))
    //         break;
    //     case 'banknifty':
    //         ({ month, day } = getNextWeekday(currentDate, 3))
    //         break;
    //     case 'finnifty':
    //         ({ month, day } = getNextWeekday(currentDate, 2))
    //         break;
    //     case 'midcpnifty':
    //         ({ month, day } = getNextWeekday(currentDate, 1))
    //         break;
    //     case 'sensex':
    //         ({ month, day } = getNextWeekday(currentDate, 5))
    //         break;
    //     case 'bankex':
    //         ({ month, day } = getNextWeekday(currentDate, 1))
    //         break;
    //     default:
    //         alpaMonth = new Date().toLocaleString('default', { month: 'short' }).toUpperCase();

    //         day = 69
    //         break;
    // }









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
    } else if (symbol === 'hdfcbank' || symbol === "infy" || symbol === 'axisbank' || symbol === 'icicibank') {
        gap = 10;
    } else if (symbol === 'sbin') {
        gap = 5;
    }

    for (let i = -numStrikesBefore; i <= numStrikesAfter; i++) {
        const strikePrice = roundLTP + i * gap;
        strikePrices.push(strikePrice);
    }

    return strikePrices;
}
// Function to format date as yyyy-mm-dd
function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}
module.exports = router;
