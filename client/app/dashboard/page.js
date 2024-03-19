"use client"
import React, { useEffect, useState } from 'react';
import '.././globals.css';
import Navbar from '../components/Navbar';
import Purplebutton from '../components/Purplebutton';
import Link from 'next/link';
import Loading from '../components/Loading';
import io from 'socket.io-client';
import axios from 'axios';

const Page = () => {
    // All the variable that we are using for storing the data in response
    const [loading, setLoading] = useState(true);
    const [spotLTP, setSpotLTP] = useState([]);
    const [spotLTPCompleteData, setSpotLTPCompleteData] = useState([]);
    const [Divergencedata, setDivergencedata] = useState([])
    const [futureDivergenceData, setfutureDivergenceData] = useState([])
    const [CeDivergencedata, setCeDivergencedata] = useState([])
    const [PeDivergencedata, setPeDivergencedata] = useState([])
    const [stockDataCE, setStockDataCE] = useState([]);
    const [stockDataPE, setStockDataPE] = useState([]);
    const [expiryDates, setexpiryDates] = useState([])
    const [recordStockDataCE, setRecordStockDataCE] = useState([]);
    const [recordStockDataCECompleteData, setRecordStockDataCECompleteData] = useState([]);
    const [recordStockDataPE, setRecordStockDataPE] = useState([]);
    const [recordStockDataPECompleteData, setRecordStockDataPECompleteData] = useState([]);
    const [timeUpdateDuration, setTimeUpdateDuration] = useState('10s');
    const [futuresData, setFuturesData] = useState([]);
    const [futuresDataCompleteData, setFuturesDataCompleteData] = useState([]);
    const [strikePrices, setStrikePrices] = useState([]);
    const [selectedExpiryDate, setselectedExpiryDate] = useState('')
    const [selectedStrikePrice, setSelectedStrikePrice] = useState('');
    const [symbol, setSymbol] = useState('');
    const [index, setIndex] = useState('nifty');

    // Mai Function Which Fetch Data from Server
    const fetchSpotLTP = async () => {
        let socket;
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
        const futuresResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v3/futures/${index || symbol}`);
        const futureSymbol = futuresResponse.data.d[0].n;
        let OptionsResponse, CeStrikeSymbol, PeStrikeSymbol
        if (selectedStrikePrice !== '') {
            setRecordStockDataCECompleteData([])
            setRecordStockDataPECompleteData([])
            setRecordStockDataCE([])
            setRecordStockDataPE([])
            OptionsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/option-chain/single-strike/${index || symbol}/${selectedStrikePrice}`)
            CeStrikeSymbol = OptionsResponse.data.d[0].n
            PeStrikeSymbol = OptionsResponse.data.d[1].n
        }
        try {
            const socket = io(`${process.env.NEXT_PUBLIC_WS_URL}`, {
                path: '/socket.io',
            });

            socket.on('connect', async () => {
                socket.emit('SpotLTPData', indexMapping[index || symbol]);
                socket.emit('FutureLTPData', futureSymbol);
                if (selectedStrikePrice !== '') {
                    socket.emit('OptionSymbolData', [CeStrikeSymbol, PeStrikeSymbol]);
                }
            });
            socket.on('symbolData', (data) => {
                if (data.code !== 200) {
                    const indianTime = convertEpochToIndiaTime(data.exch_feed_time);
                    if (data.symbol === futureSymbol) {
                        setFuturesDataCompleteData((prevData) => {
                            const newData = [
                                ...prevData,
                                { symbol: data.symbol, ltp: data.ltp, exch_feed_time: data.exch_feed_time, indian_time: indianTime }
                            ];
                            const filteredData = filterMinuteData(newData, timeUpdateDuration)
                            setFuturesData(filteredData)
                            return newData;
                        });
                    }
                    else if (data.symbol === indexMapping[index || symbol]) {
                        setSpotLTPCompleteData((prevData) => {
                            const newData = [
                                ...prevData,
                                { symbol: data.symbol, ltp: data.ltp, exch_feed_time: data.exch_feed_time, indian_time: indianTime }
                            ];
                            const filteredData = filterMinuteData(newData, timeUpdateDuration);
                            setSpotLTP(filteredData);
                            return newData;
                        });
                    } else if (data.symbol === CeStrikeSymbol) {
                        setRecordStockDataCECompleteData((prevData) => {
                            const newData = [
                                ...prevData,
                                { symbol: data.symbol, ltp: data.ltp, exch_feed_time: data.exch_feed_time, indian_time: indianTime }
                            ];
                            const filteredData = filterMinuteData(newData, timeUpdateDuration);
                            setRecordStockDataCE(filteredData)
                            return newData;
                        });
                    } else if (data.symbol === PeStrikeSymbol) {
                        setRecordStockDataPECompleteData((prevData) => {
                            const newData = [
                                ...prevData,
                                { symbol: data.symbol, ltp: data.ltp, exch_feed_time: data.exch_feed_time, indian_time: indianTime }
                            ];
                            const filteredData = filterMinuteData(newData, timeUpdateDuration);
                            setRecordStockDataPE(filteredData)
                            return newData;
                        });
                    }
                }
            });
            return () => {
                if (socket && socket.connected) {
                    socket.emit('disconnect');
                    socket.close();
                }
            };
        } catch (error) {
            console.error(`Error fetching spot LTP: ${error.message}`);
            if (socket && socket.connected) {
                socket.close();
            }
        }
    };
    const fetchRealTimeData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/option-chain/all/${index || symbol}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch data. HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();

            if (responseData.code === 200) {
                const dataArray = responseData.d || [];

                const stockDataCE = dataArray.slice(0, 9);
                const stockDataPE = dataArray.slice(9);

                setStockDataCE(stockDataCE);
                setStockDataPE(stockDataPE);
            }
        } catch (error) {
            console.error('Error fetching real-time data:', error);
        } finally {
            setLoading(false);
        }
    };
    const fetchStrikePrices = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/option-chain/strikes/${index || symbol}`);
            const parsedData = await response.json();
            const strikePrices = parsedData;
            setStrikePrices(strikePrices);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching strike prices:', error);
            setLoading(false);
        }
    };
    const fetchExpirydates = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/option-chain/expiry/${index || symbol}`);
            const parsedData = await response.json();
            const expirydates = parsedData;
            setexpiryDates(expirydates[0])
            setLoading(false);
        } catch (error) {
            console.error('Error fetching strike prices:', error);
            setLoading(false);
            throw new Error('Error fetching strike prices');
        }
    };
    const handleIndexChange = (event) => {
        const newIndex = event.target.value;
        if (index === '' && newIndex !== '') {
            setSymbol('');
        }
        clearAllStates();
        setLoading(true);
        setIndex(newIndex);
    };
    const handleSymbolChange = (event) => {
        const newSymbol = event.target.value;
        if (symbol === '' && newSymbol !== '') {
            setIndex('');
        }
        clearAllStates();
        setLoading(true);
        setSymbol(newSymbol);
    };
    const handleExpirydate = async (event) => {
        const eventValue = event.target.value;
        const apiURL = `${process.env.NEXT_PUBLIC_API_URL}/option-chain/all/${index || symbol}/${eventValue}`;

        setselectedExpiryDate([eventValue]);
        setLoading(true);

        if (eventValue !== '') {
            try {
                const response = await fetch(apiURL);
                if (!response.ok) {
                    throw new Error(`Failed to fetch Strike Prices For the Given Expiry Date`);
                }
                const parsedData = await response.json();
                const dataArray = parsedData.d || [];
                const stockDataCE = dataArray.slice(0, 9);
                const stockDataPE = dataArray.slice(9);
                setStockDataCE(stockDataCE);
                setStockDataPE(stockDataPE);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        } else {
            clearSelectedStrikeStates();
        }
    };
    const handleCustomExpiryDateChange = async (event) => {
        const inputDate = event.target.value;
        const formatDateString = (dateString) => {
            const dateObj = new Date(dateString);
            const options = { day: '2-digit', month: 'short', year: 'numeric' };
            const formattedDate = dateObj.toLocaleDateString('en-GB', options);

            // Splitting the formatted date to get day, month, and year
            const [day, month, year] = formattedDate.split(' ');

            // Reformatting with hyphen
            return `${day}-${month}-${year}`;
        };
        if (inputDate) {
            const formattedDate = [formatDateString(inputDate)];
            const apiURL = `${process.env.NEXT_PUBLIC_API_URL}/option-chain/all/${index || symbol}/${formattedDate}`;
            setselectedExpiryDate('');
            setLoading(true);

            if (formattedDate !== '') {
                try {
                    const response = await fetch(apiURL);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch Strike Prices For the Given Expiry Date`);
                    }
                    const parsedData = await response.json();
                    const dataArray = parsedData.d || [];
                    const stockDataCE = dataArray.slice(0, 9);
                    const stockDataPE = dataArray.slice(9);
                    setStockDataCE(stockDataCE);
                    setStockDataPE(stockDataPE);
                } catch (error) {
                    console.error('Error fetching data:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                clearSelectedStrikeStates();
            }
        }

    };
    const handleStrikeChange = async (event) => {
        const eventValue = event.target.value;
        setSelectedStrikePrice([eventValue]);
        if (eventValue === '') {
            setSelectedStrikePrice('')
            clearAllStates();
        }
    };
    const handleTimeDurationChange = (event) => {
        const selectedTime = event.target.value;
        setTimeUpdateDuration(selectedTime);
    };
    const updateFormattedDate = (event) => {
        console.log('clicked');
    }
    function clearAllStates() {
        setSpotLTPCompleteData([])
        setSpotLTP([]);
        setFuturesDataCompleteData([])
        setFuturesData([])
        setStockDataCE([]);
        setStockDataPE([]);
        setSelectedStrikePrice('');
        setRecordStockDataCE([]);
        setRecordStockDataPE([]);
        setRecordStockDataCECompleteData([])
        setRecordStockDataPECompleteData([])
    };
    function clearSelectedStrikeStates() {
        setRecordStockDataCECompleteData([])
        setRecordStockDataPECompleteData([])
        setRecordStockDataCE([]);
        setRecordStockDataPE([]);
        setSelectedStrikePrice('');
    };
    function convertEpochToIndiaTime(epochTimestamp) {
        const epochMillis = epochTimestamp * 1000;
        const date = new Date(epochMillis);

        // Check if the date is valid
        if (isNaN(date.getTime())) {
            // Date is not valid, return placeholder
            return "---";
        }

        const options = {
            timeZone: 'Asia/Kolkata',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: true,
        };
        const indiaTime = date.toLocaleString('en-IN', options);

        return indiaTime;
    }
    function convertEpochToIndiaTimeForTable(epochTimestamp) {
        const epochMillis = epochTimestamp * 1000;
        const date = new Date(epochMillis);


        // Check if the date is valid
        if (isNaN(date.getTime())) {
            // Date is not valid, return placeholder
            return "---";
        }
        const options = {
            timeZone: 'Asia/Kolkata',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        };
        const indiaTime = date.toLocaleString('en-IN', options);

        return indiaTime;
    }
    function formatEpochTimeToIST(epochTime) {
        const date = new Date(epochTime * 1000);
        const options = { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric' };

        const istFormatter = new Intl.DateTimeFormat('en-IN', options);
        const istDateString = istFormatter.format(date);

        return istDateString;
    };
    const DivergenceData = () => {
        const divergence = ["--",];
        for (let i = 0; i < spotLTP.length - 1; i++) {
            const spotLTP_first_value = spotLTP[i]?.ltp;
            const spotLTP_second_value = spotLTP[i + 1]?.ltp;
            const differenceBetweenSpotLTP = parseFloat((spotLTP_second_value - spotLTP_first_value).toFixed(2));

            if (differenceBetweenSpotLTP > 0) {
                divergence.push(
                    <span key={i} className="text-green-500">
                        {differenceBetweenSpotLTP} <span className="text-lg">&uarr;</span>
                    </span>
                );
            } else if (differenceBetweenSpotLTP < 0) {
                divergence.push(
                    <span key={i} className="text-red-500">
                        {Math.abs(differenceBetweenSpotLTP)} <span className="text-lg">&darr;</span>
                    </span>
                );
            } else {
                divergence.push("--");
            }
        }

        divergence.push("--");

        setDivergencedata(divergence);
    };
    const FutureDivergenceCalc = () => {
        const divergence = ["--",];

        for (let i = 0; i < futuresData.length - 1; i++) {
            const future_First_value = futuresData[i]?.ltp;
            const Future_second_value = futuresData[i + 1]?.ltp;
            const differenceBetweenSpotLTP = parseFloat((Future_second_value - future_First_value).toFixed(2));

            if (differenceBetweenSpotLTP > 0) {
                divergence.push(
                    <span key={i} className="text-green-500">
                        {differenceBetweenSpotLTP} <span className="text-lg">&uarr;</span>
                    </span>
                );
            } else if (differenceBetweenSpotLTP < 0) {
                divergence.push(
                    <span key={i} className="text-red-500">
                        {Math.abs(differenceBetweenSpotLTP)} <span className="text-lg">&darr;</span>
                    </span>
                );
            } else {
                divergence.push("--");
            }
        }

        divergence.push("--");

        setfutureDivergenceData(divergence);
    };
    const CeDivergenceFunction = () => {
        const divergence = ["--",];

        for (let i = 0; i < recordStockDataCE.length - 1; i++) {
            const recordCe_first_value = recordStockDataCE[i]?.ltp;
            const recordPe_second_valu = recordStockDataCE[i + 1]?.ltp;
            const differenceBetweenSpotLTP = parseFloat((recordPe_second_valu - recordCe_first_value).toFixed(2));

            if (differenceBetweenSpotLTP > 0) {
                divergence.push(
                    <span key={i} className="text-green-500">
                        {differenceBetweenSpotLTP} <span className="text-lg">&uarr;</span>
                    </span>
                );
            } else if (differenceBetweenSpotLTP < 0) {
                divergence.push(
                    <span key={i} className="text-red-500">
                        {Math.abs(differenceBetweenSpotLTP)} <span className="text-lg">&darr;</span>
                    </span>
                );
            } else {
                divergence.push("--");
            }
        }

        divergence.push("--");

        setCeDivergencedata(divergence);
    };
    const PedivergenceFunction = () => {
        const divergence = ["--",];

        for (let i = 0; i < recordStockDataPE.length - 1; i++) {
            const recordspe_first_value = recordStockDataPE[i]?.ltp;
            const recordspe_second_value = recordStockDataPE[i + 1]?.ltp;
            const differenceBetweenSpotLTP = parseFloat((recordspe_second_value - recordspe_first_value).toFixed(2));

            if (differenceBetweenSpotLTP > 0) {
                divergence.push(
                    <span key={i} className="text-green-500">
                        {differenceBetweenSpotLTP} <span className="text-lg">&uarr;</span>
                    </span>
                );
            } else if (differenceBetweenSpotLTP < 0) {
                divergence.push(
                    <span key={i} className="text-red-500">
                        {Math.abs(differenceBetweenSpotLTP)} <span className="text-lg">&darr;</span>
                    </span>
                );
            } else {
                divergence.push("--");
            }
        }

        divergence.push("--");

        setPeDivergencedata(divergence);
    };
    // function filterMinuteData(dataArray, filterInterval) {
    //     const intervals = {
    //         '10s': 10,
    //         '30s': 30,
    //         '1m': 60,
    //         '2m': 120,
    //         '3m': 180
    //     };

    //     if (!intervals.hasOwnProperty(filterInterval)) {
    //         return [];
    //     }

    //     const intervalSeconds = intervals[filterInterval];
    //     let filteredData = [];

    //     // Create a map to store the latest data for each currentTime
    //     const latestDataMap = new Map();

    //     // Boolean flag to track if the first value has been processed
    //     let isFirstValueProcessed = false;

    //     // Iterate through dataArray to find the latest data for each currentTime
    //     for (let i = 0; i < dataArray.length; i++) {
    //         const currentTime = dataArray[i].indian_time.split(":");
    //         const currentHours = parseInt(currentTime[0]);
    //         const currentMinutes = parseInt(currentTime[1]);
    //         const currentSeconds = parseInt(currentTime[2].split(" ")[0]);

    //         // Calculate total seconds to simplify comparisons
    //         const totalSeconds = currentHours * 3600 + currentMinutes * 60 + currentSeconds;

    //         // Check if the currentTime falls within the specified interval and skip the first value
    //         if (isFirstValueProcessed && totalSeconds % intervalSeconds === 0) {
    //             // Check if the latest data for this currentTime already exists in the map
    //             if (!latestDataMap.has(totalSeconds)) {
    //                 // If not, add the current data to the map
    //                 latestDataMap.set(totalSeconds, dataArray[i]);
    //             } else {
    //                 // If yes, update the existing data if it's newer
    //                 const existingData = latestDataMap.get(totalSeconds);
    //                 if (dataArray[i].indian_time > existingData.indian_time) {
    //                     latestDataMap.set(totalSeconds, dataArray[i]);
    //                 }
    //             }
    //         } else {
    //             // Skip the first value
    //             isFirstValueProcessed = true;
    //         }
    //     }

    //     // Extract the latest data from the map and add it to the filteredData array
    //     latestDataMap.forEach((latestData) => {
    //         filteredData.push(latestData);
    //     });

    //     return filteredData;
    // }
    function filterMinuteData(dataArray, filterInterval) {
        const intervals = {
            '1s': 1,
            '3s': 3,
            '10s': 10,
            '30s': 30,
            '1m': 60,
            '2m': 120,
            '3m': 180
        };

        if (!intervals.hasOwnProperty(filterInterval)) {
            return [];
        }

        const intervalSeconds = intervals[filterInterval];
        let filteredData = [];

        // Create a map to store the latest data for each currentTime
        const latestDataMap = new Map();

        // Boolean flag to track if the first value has been processed
        let isFirstValueProcessed = false;

        // Iterate through dataArray to find the latest data for each currentTime
        for (let i = 0; i < dataArray.length; i++) {
            const currentTime = dataArray[i].indian_time.split(":");
            const currentHours = parseInt(currentTime[0]);
            const currentMinutes = parseInt(currentTime[1]);
            const currentSeconds = parseInt(currentTime[2].split(" ")[0]);

            // Calculate total seconds to simplify comparisons
            const totalSeconds = currentHours * 3600 + currentMinutes * 60 + currentSeconds;

            // Check if the currentTime falls within the specified interval and skip the first value
            if (isFirstValueProcessed && totalSeconds % intervalSeconds === 0) {
                // Check if the latest data for this currentTime already exists in the map
                if (!latestDataMap.has(totalSeconds)) {
                    // If not, add the current data to the map
                    latestDataMap.set(totalSeconds, dataArray[i]);
                } else {
                    // If yes, update the existing data if it's newer
                    const existingData = latestDataMap.get(totalSeconds);
                    if (dataArray[i].indian_time > existingData.indian_time) {
                        latestDataMap.set(totalSeconds, dataArray[i]);
                    }
                }
            } else {
                // Skip the first value
                isFirstValueProcessed = true;
            }
        }

        // Extract the latest data from the map and add it to the filteredData array
        latestDataMap.forEach((latestData) => {
            filteredData.push(latestData);
        });

        return filteredData;
    }
    useEffect(() => {
        const fetchDataAndUpdateMainData = async () => {
            if (selectedStrikePrice !== '') {
                await Promise.all([
                    fetchSpotLTP(),
                    filterMinuteData()
                ]);
            }
            const mainDataFunctions = async () => {
                await Promise.all([
                    fetchSpotLTP(),
                    filterMinuteData(),
                    fetchRealTimeData(),
                    fetchExpirydates(),
                    fetchStrikePrices(),
                ]);
            };
            mainDataFunctions();
        };

        fetchDataAndUpdateMainData();
    }, [index, symbol, selectedStrikePrice, timeUpdateDuration]);
    useEffect(() => {
        DivergenceData()
        FutureDivergenceCalc()
        CeDivergenceFunction();
        PedivergenceFunction();
    }, [spotLTP, futuresData, recordStockDataCE, recordStockDataPE]);

    return (
        <>
            <Navbar />
            <div className='flex flex-col min-h-screen'>
                <main className="container mx-auto mt-7 grow">
                    <div className="flex justify-between mb-5 ">
                        <div>
                            <h4 className="text-gray-700 text-lg font-semibold">Option Chain (Equity Derivatives):</h4>
                        </div>
                        <div className="flex space-x-4">
                            <div>
                                <label className="text-gray-700" htmlFor="indexDropdown">
                                    Select Index:
                                </label>
                                <select style={{ width: '153px' }} id="indexDropdown" className="border rounded p-2 "
                                    value={index} onChange={handleIndexChange}>
                                    <option value="" disabled>--Select--</option>
                                    <option value="nifty">NIFTY</option>
                                    <option value="finnifty">FINNIFTY</option>
                                    <option value="banknifty">BANKNIFTY</option>
                                    <option value="midcpnifty">MIDCPNIFTY</option>
                                    <option value="sensex">SENSEX</option>
                                    <option value="bankex">BANKEX</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-700" htmlFor="symbolDropdown">
                                    Select Symbol:
                                </label>
                                <select style={{ width: '153px' }} id="symbolDropdown" className="border rounded p-2"
                                    value={symbol} onChange={handleSymbolChange}>
                                    <option value="" disabled>--Select--</option>
                                    <option value="reliance">RELIANCE</option>
                                    <option value="hdfcbank">HDFCBANK</option>
                                    <option value="bajfinance">BAJAJJ-FINANCE</option>
                                    <option value="sbin">SBI</option>
                                    <option value="axisbank">AXISBANK</option>
                                    <option value="icicibank">ICICIBANK</option>
                                    <option value="infy">INFY</option>
                                    <option value="tcs">TCS</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-700" htmlFor="expiryDropdown">Expiry Date:</label>
                                <select style={{ width: "153px" }} id="expiryDropdown" className="border rounded p-2" value={selectedExpiryDate} onChange={handleExpirydate}>
                                    <option value="" disabled>--Select--</option>
                                    {expiryDates && expiryDates.length > 0 ? (
                                        expiryDates.map((value, index) => (
                                            <option key={index} value={value}>
                                                {value}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>Loading...</option>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-700" htmlFor="strikeDropdown">
                                    Select Strike Price:
                                </label>
                                <select style={{ width: '153px' }} id="strikeDropdown" className="border rounded p-2"
                                    value={selectedStrikePrice} onChange={handleStrikeChange}>
                                    <option value="">--Reset--</option>
                                    {Array.isArray(strikePrices) && strikePrices.length > 0 ? (
                                        strikePrices.map(strike => (
                                            <option key={strike} value={strike}>
                                                {strike}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>Loading...</option>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="text-gray-700" htmlFor="timeDropdown">
                                    Time Duration:
                                </label>
                                <select style={{ width: "153px" }} id="timeDropdown" className="border rounded p-2"
                                    value={timeUpdateDuration} onChange={handleTimeDurationChange}>
                                    <option value="1s">1 Second</option>
                                    <option value="3s">3 Second</option>
                                    <option value="10s">10 Seconds</option>
                                    <option value="30s">30 Seconds</option>
                                    <option value="1m">1 Minute</option>
                                    <option value="2m">2 Minute</option>
                                    <option value="3m">3 Minute</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <div className="container w-full flex items-start justify-start h-5 m-2">
                            <h2 className="text-base text-gray-600 inline-block font-bold mb-2">
                                {spotLTP.length > 0 && formatEpochTimeToIST(spotLTP[0].exch_feed_time)}
                            </h2>
                        </div>
                        <div className="container w-full flex items-start justify-end h-5 m-2">
                            {loading && <Loading />}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <div className='mb-3'>
                            <label className="text-gray-700" htmlFor="datePicker">
                                Choose a Expiry:
                            </label>
                            <input
                                value={'DD-MM-YYYY'}
                                type="date"
                                id="datePicker"
                                className="border border-gray-400 rounded p-1 ml-2 text-sm"
                                onChange={handleCustomExpiryDateChange}
                            />
                        </div>
                    </div>


                    <div className="flex justify-between">
                        <div className="overflow-x-auto flex-grow mr-2">
                            <div className="table-container shadow-md rounded-md border bg-white">
                                <div className="max-h-96 overflow-y-auto">
                                    <table className="table-auto w-full border bg-white shadow-md rounded-md">
                                        <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                            <tr>
                                                <th className="px-4 py-2 text-center border min-w-24">Time</th>
                                                <th className="px-4 py-2 text-center border min-w-24">Spot/LTP</th>
                                                {(recordStockDataCE || recordStockDataPE).length != 0 && <th className="px-4 py-2 text-center border min-w-24">Spot Divergence</th>}
                                                <th className="px-4 py-2 text-center border min-w-24">Future Price</th>
                                                {(recordStockDataCE || recordStockDataPE).length != 0 && <th className="px-4 py-2 text-center border min-w-24">Future Divergence</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="max-h-96 overflow-y-auto">
                                            {spotLTP.map((value, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-center border">{convertEpochToIndiaTime(value.exch_feed_time)}</td>
                                                    <td className="px-4 py-2 text-center border">{value.ltp}</td>
                                                    {(recordStockDataCE || recordStockDataPE).length != 0 && <td className="px-4 py-2 text-center border">{Divergencedata[index]}</td>}
                                                    <td className="px-4 py-2 text-center border">{futuresData.length > 0 ? (futuresData[index]?.ltp) : 'Loading...'}</td>
                                                    {(recordStockDataCE || recordStockDataPE).length != 0 && <td className="px-4 py-2 text-center border">{futureDivergenceData[index]}</td>}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        {selectedStrikePrice === '' && <div className="overflow-x-auto flex-grow ml-2">
                            <div className="table-container shadow-md rounded-md border bg-white">
                                <div className="max-h-96 overflow-y-auto">
                                    <table className="table-auto w-full border bg-white shadow-md rounded-md">
                                        <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                            <tr>
                                                {(recordStockDataCE || recordStockDataPE).length == 0 && <th className="px-4 py-2 text-center border min-w-24">Strike</th>}
                                                <th className="px-4 py-2 text-center border min-w-24">CE/LTP</th>
                                                <th className="px-4 py-2 text-center border min-w-24">PE/LTP</th>
                                            </tr>
                                        </thead>
                                        <tbody className="max-h-96 overflow-y-auto">
                                            {Array.isArray(strikePrices) ? strikePrices.map((value, index) => (
                                                <tr key={index}>
                                                    {(recordStockDataCE || recordStockDataPE).length == 0 && <td className="px-4 py-2 text-center border">{Array.isArray(strikePrices) && strikePrices.length > 0 ? value : 'Loading...'}</td>}
                                                    <td className="px-4 py-2 text-center border">{recordStockDataCE.length == 0 && stockDataCE[index]?.v.lp}</td>
                                                    <td className="px-4 py-2 text-center border">{recordStockDataPE.length == 0 && stockDataPE[index]?.v.lp}</td>
                                                </tr>
                                            )) : <tr><td></td></tr>}
                                        </tbody>

                                    </table>
                                </div>
                            </div>
                        </div>}
                        {selectedStrikePrice !== '' && <div className="overflow-x-auto flex-grow ml-2">
                            <div className="table-container shadow-md rounded-md border bg-white">
                                <div className="max-h-96 overflow-y-auto">
                                    <table className="table-auto w-full border bg-white shadow-md rounded-md">
                                        <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                            <tr>
                                                <th className="px-4 py-2 text-center border min-w-24">Time</th>
                                                <th className="px-4 py-2 text-center border min-w-24">CE/LTP</th>
                                                {(recordStockDataCE || recordStockDataPE).length != 0 && <th className="px-4 py-2 text-center border min-w-24">CE Divergence</th>}
                                                <th className="px-4 py-2 text-center border min-w-24">PE/LTP</th>
                                                {(recordStockDataCE || recordStockDataPE).length != 0 && <th className="px-4 py-2 text-center border min-w-24">PE Divergence</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="max-h-96 overflow-y-auto">
                                            {recordStockDataCE.map((value, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-center border">{convertEpochToIndiaTime(value.exch_feed_time)}</td>
                                                    <td className="px-4 py-2 text-center border">{recordStockDataCE.length !== 0 && (recordStockDataCE[index]?.ltp)}</td>
                                                    {(recordStockDataCE.length > 0 && recordStockDataPE.length > 0) && <td className="px-4 py-2 text-center border">{CeDivergencedata[index]}</td>}
                                                    <td className="px-4 py-2 text-center border">{recordStockDataPE.length !== 0 && (recordStockDataPE[index]?.ltp)}</td>
                                                    {(recordStockDataCE.length > 0 && recordStockDataPE.length > 0) && <td className="px-4 py-2 text-center border">{PeDivergencedata[index]}</td>}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>}
                    </div>


                </main>
                <footer className="text-black mt-20">
                    <section className="bg-gray-100 py-16">
                        <div className="container mx-auto text-center">
                            <h2 className="text-3xl font-bold mb-4">Analyze Historical Data</h2>
                            <p className="text-lg mb-6">Explore a chronological record of your interactions and discoveries.
                                Revisit and analyze your past views to gain insights and make informed decisions.</p>
                            <Link href="/history">
                                <Purplebutton data="View Historical Data" />
                            </Link>
                            <Link href="/records">
                                <Purplebutton data="Analyze Stock Records" />
                            </Link>
                        </div>
                    </section>
                </footer>
            </div>
        </>
    );
};
export default Page;