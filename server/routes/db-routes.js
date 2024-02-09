const express = require('express');
const axios = require('axios');
const History = require('../db/historyModel');
const router = express.Router();
require('dotenv').config()

router.get('/insert/:symbol', async (req, res) => {
    const symbol = req.params.symbol;
    try {
        const apiResponse = await axios.get(`${process.env.MAIN_URL}/api/v3/history/${symbol}`);

        const capturedData = new History({
            name: symbol,
            data: apiResponse.data,
        });

        await capturedData.save();

        res.json({ success: true, message: 'Data has been Inserted Successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});
router.get('/history', async (req, res) => {
    try {
        const historyData = await History.find({});
        res.json({ success: true, data: historyData });
    } catch (error) {
        // console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});
router.get('/history/:symbol', async (req, res) => {
    const symbol = req.params.symbol;

    try {
        const historyData = await History.findOne({ name: symbol });

        if (!historyData) {
            return res.status(404).json({ success: false, error: 'Data not found for the symbol' });
        }
        const combinedCandles = historyData.data.reduce((result, item) => {
            return result.concat(item.candles);
        }, []);

        res.json({ success: true, name: historyData.name, data: combinedCandles });
    } catch (error) {
        // console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});
module.exports = router;
