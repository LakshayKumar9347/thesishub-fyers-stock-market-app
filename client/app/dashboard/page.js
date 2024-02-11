"use client"
import React, { useEffect, useState } from 'react';
import '.././globals.css';
import Navbar from '../components/Navbar';
import Purplebutton from '../components/Purplebutton';
import Link from 'next/link';
import Loading from '../components/Loading';

const Page = () => {
    const [loading, setLoading] = useState(true);
    const [spotLTP, setSpotLTP] = useState([]);
    const [stockDataCE, setStockDataCE] = useState([]);
    const [stockDataPE, setStockDataPE] = useState([]);
    const [expiryDates, setexpiryDates] = useState([])
    const [comparisionSymbolMandT, setComparisionSymbolMandT] = useState('');
    const [recordStockDataCE, setRecordStockDataCE] = useState([]);
    const [recordStockDataPE, setRecordStockDataPE] = useState([]);
    const [timeUpdateDuration, setTimeUpdateDuration] = useState(60000);
    const [futuresData, setFuturesData] = useState([]);
    const [strikePrices, setStrikePrices] = useState([]);
    const [selectedExpiryDate, setselectedExpiryDate] = useState('')
    const [selectedStrikePrice, setSelectedStrikePrice] = useState('');
    const [symbol, setSymbol] = useState('');
    const [index, setIndex] = useState('nifty');

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
            setLoading(false);
        } catch (error) {
            console.error('Error fetching real-time data:', error);
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
            throw new Error('Error fetching strike prices');
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

    const fetchSpotLTP = async () => {
        const apiUrl = `http://localhost:5000/records/index/${index || symbol}`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch spot LTP. Status: ${response.status}`);
            }
            const parsedData = await response.json();
            if (!parsedData || !parsedData.candles) {
                throw new Error("Invalid data format received from the server");
            }
            setSpotLTP(parsedData.candles);
        } catch (error) {
            console.error(`Error fetching spot LTP: ${error.message}`);
        }
    };

    const fetchFuturesData = async () => {
        try {
            const apiUrl = `http://localhost:5000/api/v3/futures/${index || symbol}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Error fetching futures data for ${index || symbol}`);
            }
            const data = await response.json();
            const newData = data.d;
            setFuturesData(newData);
        } catch (error) {
            console.error('Error fetching futures data:', error);
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

    // const handleStrikeChange = async (event) => {
    //     const eventValue = event.target.value;
    //     setSelectedStrikePrice([eventValue]);
    //     if (eventValue === '') {
    //         clearSelectedStrikeStates();
    //     } else {
    //         try {
    //             const responseCE = await fetch(`http://localhost:5000/records/ce/${index || symbol}/${eventValue}`);
    //             const responsePE = await fetch(`http://localhost:5000/records/pe/${index || symbol}/${eventValue}`);
    //             const parsedDataCE = await responseCE.json();
    //             const parsedDataPE = await responsePE.json();
    //             setRecordStockDataCE(parsedDataCE.candles);
    //             setRecordStockDataPE(parsedDataPE.candles);
    //             getSymbol();
    //         } catch (error) {
    //             console.error(`Error fetching Records ${error.message}`);
    //         }
    //     }
    // };
    const handleStrikeChange = async (event) => {
        const eventValue = event.target.value;
        setSelectedStrikePrice([eventValue]);
        if (eventValue === '') {
            clearSelectedStrikeStates();
        } else {
            try {
                const responseCE = await fetch(`http://localhost:5000/records/ce/${index || symbol}/${eventValue}`);
                const responsePE = await fetch(`http://localhost:5000/records/pe/${index || symbol}/${eventValue}`);
                const parsedDataCE = await responseCE.json();
                const parsedDataPE = await responsePE.json();

                if (parsedDataCE && parsedDataCE.candles && Array.isArray(parsedDataCE.candles)) {
                    setRecordStockDataCE(parsedDataCE.candles);
                } else {
                    console.error('Error: CE data is missing or invalid');
                }

                if (parsedDataPE && parsedDataPE.candles && Array.isArray(parsedDataPE.candles)) {
                    setRecordStockDataPE(parsedDataPE.candles);
                } else {
                    console.error('Error: PE data is missing or invalid');
                }
            } catch (error) {
                console.error(`Error fetching Records`,error);
            }
        }
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
                    throw new Error(`Failed to fetch data. HTTP error! Status: ${response.status}`);
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
    const handleTimeDurationChange = (event) => {
        const selectedTime = event.target.value;
        // console.log(selectedTime);
        setTimeUpdateDuration(parseInt(selectedTime));
    };
    function clearAllStates() {
        setStockDataCE([]);
        setStockDataPE([]);
        setSpotLTP([]);
        setSelectedStrikePrice('');
        setRecordStockDataCE([]);
        setRecordStockDataPE([]);
    }
    function clearSelectedStrikeStates() {
        setRecordStockDataCE([]);
        setRecordStockDataPE([]);
        setSelectedStrikePrice('');
    }
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
    }
    function formatEpochTimeToIST(epochTime) {
        const date = new Date(epochTime * 1000);
        const options = { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric' };

        const istFormatter = new Intl.DateTimeFormat('en-IN', options);
        const istDateString = istFormatter.format(date);

        return istDateString;
    }
    const getSymbol = () => {
        const symbols = [];
        for (let i = 0; i < spotLTP.length - 1; i++) {
            const spotLTP_first_value = spotLTP[i][4];
            const spotLTP_second_value = spotLTP[i + 1][4];
            const CE_first_value = recordStockDataCE[i][4];
            const CE_second_value = recordStockDataCE[i + 1][4];
            const PE_first_value = recordStockDataPE[i][4];
            const PE_second_value = recordStockDataPE[i + 1][4];

            if (
                spotLTP_first_value < spotLTP_second_value &&
                PE_first_value < PE_second_value
            ) {
                symbols.push("M");
            } else if (
                spotLTP_first_value < spotLTP_second_value &&
                CE_first_value > CE_second_value
            ) {
                symbols.push("M");
            } else if (
                spotLTP_first_value < spotLTP_second_value &&
                CE_first_value > CE_second_value &&
                PE_first_value < PE_second_value
            ) {
                symbols.push("M2");
            } else if (
                spotLTP_first_value > spotLTP_second_value &&
                CE_first_value < CE_second_value
            ) {
                symbols.push("T");
            } else if (
                spotLTP_first_value > spotLTP_second_value &&
                PE_first_value < PE_second_value
            ) {
                symbols.push("T");
            } else if (
                spotLTP_first_value > spotLTP_second_value &&
                CE_first_value < CE_second_value &&
                PE_first_value < PE_second_value
            ) {
                symbols.push("T2");
            } else {
                symbols.push("--"); // Default symbol if none of the conditions are met
            }
        }

        // Adjust symbols array length to match spotLTP array length
        while (symbols.length < spotLTP.length) {
            // If symbols array is shorter than spotLTP, add default symbol
            symbols.push("--");
        }

        setComparisionSymbolMandT(symbols);
    };
    useEffect(() => {
        const mainDataFunctions = async () => {
            await Promise.all([
                fetchRealTimeData(),
                fetchSpotLTP(),
                fetchFuturesData(),
                fetchStrikePrices(),
                fetchExpirydates()
            ]);
            if ((recordStockDataCE || recordStockDataPE).length != 0) {
                getSymbol()
            }
        };

        mainDataFunctions();
        const intervalId = setInterval(mainDataFunctions, timeUpdateDuration);
        return () => clearInterval(intervalId);
    }, [index, symbol, timeUpdateDuration, recordStockDataCE, recordStockDataPE]);
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
                                {spotLTP.length > 0 && formatEpochTimeToIST(spotLTP[0][0])}
                            </h2>
                        </div>
                        <div className="container w-full flex items-start justify-end h-5 m-2">
                            {loading && <Loading />}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="table-container">
                            <div className="max-h-96 overflow-y-auto">
                                <table className="table-auto w-full border bg-white shadow-md rounded-md">
                                    <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                        <tr>
                                            <th className="px-4 py-2 text-center border">Time</th>
                                            <th className="px-4 py-2 text-center border">Spot/LTP</th>
                                            <th className="px-4 py-2 text-center border">Future Price</th>
                                            <th className="px-4 py-2 text-center border">Disc/Premium</th>
                                            <th className="px-4 py-2 text-center border">Strike</th>
                                            <th className="px-4 py-2 text-center border">CE/LTP</th>
                                            <th className="px-4 py-2 text-center border">PE/LTP</th>
                                            {(recordStockDataCE || recordStockDataPE).length != 0 && <th className="px-4 py-2 text-center border">Symbols</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="max-h-80 overflow-y-scroll">
                                        {spotLTP.map((value, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2 text-center border">{convertEpochToIndiaTime(value[0])}</td>
                                                <td className="px-4 py-2 text-center border">{value[4]}</td>
                                                <td className="px-4 py-2 text-center border">{futuresData.length > 0 ? futuresData[index]?.v.lp : 'Loading...'}</td>
                                                <td className="px-4 py-2 text-center border">{futuresData.length > 0 ? (futuresData[0].v.lp - value[4]).toFixed(2) : 'Loading...'}</td>
                                                <td className="px-4 py-2 text-center border">{Array.isArray(strikePrices) && strikePrices.length > 0 ? strikePrices[index] : 'Loading...'}</td>
                                                <td className="px-4 py-2 text-center border">{recordStockDataCE.length === 0 ? stockDataCE[index]?.v.lp : (recordStockDataCE[index][4])}</td>
                                                <td className="px-4 py-2 text-center border">{recordStockDataPE.length === 0 ? stockDataPE[index]?.v.lp : (recordStockDataPE[index][4])}</td>
                                                {(recordStockDataCE || recordStockDataPE).length != 0 && <td className="px-4 py-2 text-center border">{comparisionSymbolMandT[index]}</td>}
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
                                <Purplebutton data="View History" />
                            </Link>
                            <Link href="/">
                                <Purplebutton data="Go To Home" />
                            </Link>
                        </div>
                    </section>
                </footer>
            </div>
        </>
    );
};

export default Page;
