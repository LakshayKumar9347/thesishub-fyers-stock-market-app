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
    const [Divergencedata, setDivergencedata] = useState([])
    const [futureDivergenceData, setfutureDivergenceData] = useState([])
    const [CeDivergencedata, setCeDivergencedata] = useState([])
    const [PeDivergencedata, setPeDivergencedata] = useState([])
    const [stockDataCE, setStockDataCE] = useState([]);
    const [stockDataPE, setStockDataPE] = useState([]);
    const [expiryDates, setexpiryDates] = useState([])
    const [recordStockDataCE, setRecordStockDataCE] = useState([]);
    const [recordStockDataPE, setRecordStockDataPE] = useState([]);
    const [timeUpdateDuration, setTimeUpdateDuration] = useState(60006);
    const [futuresData, setFuturesData] = useState([]);
    const [strikePrices, setStrikePrices] = useState([]);
    const [selectedExpiryDate, setselectedExpiryDate] = useState('')
    const [selectedStrikePrice, setSelectedStrikePrice] = useState('');
    const [symbol, setSymbol] = useState('');
    const [index, setIndex] = useState('nifty');

    // Mai Function Which Fetch Data from Server
    const fetchSpotLTP = async () => {
        let socket;
        let previousEpochTimes = new Set();
        const futuresResponse = await axios.get(`http://localhost:5000/api/v3/futures/${index || symbol}`);
        const futureSymbol = futuresResponse.data.d[0].n;
        let OptionsResponse, CeStrikeSymbol, PeStrikeSymbol
        if (selectedStrikePrice !== '') {
            OptionsResponse = await axios.get(`http://localhost:5000/option-chain/single-strike/${index || symbol}/${selectedStrikePrice}`)
            CeStrikeSymbol = OptionsResponse.data.d[0].n
            PeStrikeSymbol = OptionsResponse.data.d[1].n
        }
        try {
            socket = io('http://localhost:5000');

            socket.on('connect', async () => {
                console.log('Connected to socket server');
                socket.emit('SpotLTPData', index || symbol);
                socket.emit('FutureLTPData', futureSymbol);
                if (selectedStrikePrice !== '') {
                    socket.emit('OptionSymbolData', [CeStrikeSymbol, PeStrikeSymbol]);
                }
            });

            socket.on('symbolData', (data) => {
                if (data.code !== 200) {
                    const indianTime = convertEpochToIndiaTime(data.exch_feed_time);
                    if (data.symbol === futureSymbol) {
                        setFuturesData((prevData) => [
                            ...prevData,
                            { symbol: data.symbol, ltp: data.ltp, exch_feed_time: data.exch_feed_time }
                        ]);
                    }
                    else if (data.symbol === CeStrikeSymbol) {
                        setCeDivergencedata((prevData) => [
                            ...prevData,
                            { symbol: data.symbol, ltp: data.ltp, exch_feed_time: data.exch_feed_time }
                        ]);
                    } else if (data.symbol === PeStrikeSymbol) {
                        setPeDivergencedata((prevData) => [
                            ...prevData,
                            { symbol: data.symbol, ltp: data.ltp, exch_feed_time: data.exch_feed_time }
                        ]);
                    } else {
                        setSpotLTP((prevData) => [
                            ...prevData,
                            { symbol: data.symbol, ltp: data.ltp, exch_feed_time: data.exch_feed_time }
                        ]);
                        DivergenceData()
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
            const response = await fetch(`http://localhost:5000/option-chain/all/${index || symbol}`);

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
            const response = await fetch(`http://localhost:5000/option-chain/strikes/${index || symbol}`);
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
            const response = await fetch(`http://localhost:5000/option-chain/expiry/${index || symbol}`);
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
    const fetchFuturesData = async () => {
        // const response = await axios.get(`http://localhost:5000/api/v3/futures/${index || symbol}`);
        // const futureSymbol = response.data.d[0].n;
        // let socket;
        // try {
        //     socket = io('http://localhost:5000/futures');

        //     socket.on('connect', () => {
        //         console.log('Connected to socket server');
        //         socket.emit('subscribeSymbolForFuture', futureSymbol);
        //     });

        //     socket.on('symbolData', (data) => {
        //         if (data.code !== 200) {
        //             console.log(data);
        //             // setFuturesData((prevData) => [
        //             //     ...prevData,
        //             //     { ltp: data.ltp, exch_feed_time: data.exch_feed_time }
        //             // ]);
        //         }
        //     });
        //     return () => {
        //         if (socket && socket.connected) {
        //             socket.emit('disconnect');
        //             socket.close();
        //         }
        //     };
        // } catch (error) {
        //     console.error(`Error fetching spot LTP: ${error.message}`);
        //     if (socket && socket.connected) {
        //         socket.close();
        //     }
        // }
    };
    const fetchCEData = async (value) => {
        console.log("FetchCedata");
        // const apiUrl = `http://localhost:5000/records/ce/${index || symbol}/${value}`;
        // try {
        //     const response = await fetch(apiUrl);
        //     if (!response.ok) {
        //         throw new Error(`Failed to fetch spot LTP. Status: ${response.status}`);
        //     }
        //     const parsedData = await response.json();
        //     if (!parsedData || !parsedData.candles) {
        //         throw new Error("Invalid data format received from the server");
        //     }
        //     setRecordStockDataCE(parsedData.candles);
        //     // CeDivergenceFunction(); // Call CeDivergenceFunction here

        // } catch (error) {
        //     console.error(`Error fetching spot LTP: ${error.message}`);
        // }
    };
    const fetchPEData = async (value) => {
        console.log("FetchPedata");
        // const apiUrl = `http://localhost:5000/records/pe/${index || symbol}/${value}`;
        // try {
        //     const response = await fetch(apiUrl);
        //     if (!response.ok) {
        //         throw new Error(`Failed to fetch spot LTP. Status: ${response.status}`);
        //     }
        //     const parsedData = await response.json();
        //     if (!parsedData || !parsedData.candles) {
        //         throw new Error("Invalid data format received from the server");
        //     }
        //     setRecordStockDataPE(parsedData.candles);
        //     //  PedivergenceFunction();
        // } catch (error) {
        //     console.error(`Error fetching spot LTP: ${error.message}`);
        // }
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
        const apiURL = `http://localhost:5000/option-chain/all/${index || symbol}/${eventValue}`;
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
    const handleStrikeChange = async (event) => {
        const eventValue = event.target.value;
        setSelectedStrikePrice([eventValue]);
        if (eventValue === '') {
            clearSelectedStrikeStates()
        }
    };
    const handleTimeDurationChange = (event) => {
        const selectedTime = event.target.value;
        setTimeUpdateDuration(parseInt(selectedTime));
    };
    function clearAllStates() {
        setStockDataCE([]);
        setStockDataPE([]);
        setSpotLTP([]);
        setSelectedStrikePrice('');
        setRecordStockDataCE([]);
        setRecordStockDataPE([]);
    };
    function clearSelectedStrikeStates() {
        setRecordStockDataCE([]);
        setRecordStockDataPE([]);
        setSelectedStrikePrice('');
    };
    function convertEpochToIndiaTime(epochTimestamp) {
        const epochMillis = epochTimestamp * 1000;
        const date = new Date(epochMillis);
        const options = {
            timeZone: 'Asia/Kolkata',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        };
        const indiaTime = date.toLocaleString('en-IN', options);

        return indiaTime;
    };
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
            const recordCe_first_value = recordStockDataCE[i][4];
            const recordPe_second_valu = recordStockDataCE[i + 1][4];
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
            const recordspe_first_value = recordStockDataPE[i][4];
            const recordspe_second_value = recordStockDataPE[i + 1][4];
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
    useEffect(() => {
        console.log("Rendering...1");
        const fetchDataAndUpdateMainData = async () => {
            if (selectedStrikePrice !== '') {
                await Promise.all([
                    fetchCEData(selectedStrikePrice),
                    fetchPEData(selectedStrikePrice)
                ]);
            }
            const mainDataFunctions = async () => {
                await Promise.all([
                    fetchSpotLTP(),
                    fetchFuturesData(),
                    fetchRealTimeData(),
                    fetchExpirydates(),
                    fetchStrikePrices(),
                ]);
            };
            mainDataFunctions();
        };

        fetchDataAndUpdateMainData();
    }, [index, symbol, selectedStrikePrice]);

    // useEffect(() => {
    //     console.log("Rendering...2");
    //     DivergenceData()
    //     FutureDivergenceCalc()
    //     // CeDivergenceFunction();
    //     // PedivergenceFunction();
    // }, [spotLTP, futuresData, recordStockDataCE, recordStockDataPE]);


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
                                    value={timeUpdateDuration.toString()} onChange={handleTimeDurationChange}>
                                    <option value="60000">1 Minute</option>
                                    <option value="120000">2 Minute</option>
                                    <option value="180000">3 Minute</option>
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

                    <div className="overflow-x-auto">
                        <div className="table-container shadow-md rounded-md border bg-white">
                            <div className="max-h-96 overflow-y-auto">
                                <table className="table-auto w-full border bg-white shadow-md rounded-md">
                                    <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                        <tr>
                                            <th className="px-4 py-2 text-center border">Time</th>
                                            <th className="px-4 py-2 text-center border">Spot/LTP</th>
                                            {(recordStockDataCE || recordStockDataPE).length != 0 && <th className="px-4 py-2 text-center border">Spot Divergence</th>}
                                            <th className="px-4 py-2 text-center border">Future Price</th>
                                            {(recordStockDataCE || recordStockDataPE).length != 0 && <th className="px-4 py-2 text-center border">Future Divergence</th>}
                                            {(recordStockDataCE || recordStockDataPE).length == 0 && <th className="px-4 py-2 text-center border">Strike</th>}
                                            <th className="px-4 py-2 text-center border">CE/LTP</th>
                                            {(recordStockDataCE || recordStockDataPE).length != 0 && <th className="px-4 py-2 text-center border">CE Divergence</th>}
                                            <th className="px-4 py-2 text-center border">PE/LTP</th>
                                            {(recordStockDataCE || recordStockDataPE).length != 0 && <th className="px-4 py-2 text-center border">PE Divergence</th>}
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
                                                {(recordStockDataCE || recordStockDataPE).length == 0 && <td className="px-4 py-2 text-center border">{Array.isArray(strikePrices) && strikePrices.length > 0 ? strikePrices[index] : 'Loading...'}</td>}
                                                <td className="px-4 py-2 text-center border">{recordStockDataCE.length == 0 ? stockDataCE[index]?.v.lp : (recordStockDataCE[index]?.[4])}</td>

                                                {(recordStockDataCE.length > 0 && recordStockDataPE.length > 0) && <td className="px-4 py-2 text-center border">{CeDivergencedata[index]}</td>}

                                                <td className="px-4 py-2 text-center border">{recordStockDataPE.length == 0 ? stockDataPE[index]?.v.lp : (recordStockDataPE[index]?.[4])}</td>

                                                {(recordStockDataCE.length > 0 && recordStockDataPE.length > 0) && <td className="px-4 py-2 text-center border">{PeDivergencedata[index]}</td>}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
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
