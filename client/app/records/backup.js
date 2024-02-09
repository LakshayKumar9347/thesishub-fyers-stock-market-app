"use client"
import React, { useEffect, useRef, useState } from 'react';
import '.././globals.css';
import Navbar from '../components/Navbar';
import Purplebutton from '../components/Purplebutton';
import Link from 'next/link';
import Loading from '../components/Loading';

const Page = () => {
    const [loading, setLoading] = useState(true);
    const [spotLTP, setspotLTP] = useState([])
    const [stockDataCE, setstockDataCE] = useState([]);
    const [stockDataPE, setstockDataPE] = useState([]);
    const [ComparisionSymbolMandT, setComparisionSymbolMandT] = useState([])
    const [recordStockDataCE, setrecordStockDataCE] = useState('')
    const [recordStockDataPE, setrecordStockDataPE] = useState('')
    const [timeupdateduration, settimeupdateduration] = useState('60000')
    const [futuresData, setfuturesData] = useState([])
    const [strikePrices, setStrikePrices] = useState([])
    const [selectedStrikePrice, setselectedStrikePrice] = useState('')
    const [symbol, setSymbol] = useState('');
    const [index, setIndex] = useState('nifty')

    const fetchRealTimeData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.MAIN_URL}/api/v3/option-chain/${index || symbol}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch data. HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();

            if (responseData.code === 200) {
                const dataArray = responseData.d || [];

                // Split the data into stockDataCE and stockDataPE based on the index
                const stockDataCE = dataArray.slice(0, 9);
                const stockDataPE = dataArray.slice(9);

                setstockDataCE(stockDataCE);
                setstockDataPE(stockDataPE);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching real-time data:', error);
            setLoading(false);
        }
    };
    const fetchStrikePrices = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${process.env.MAIN_URL}/api/v3/option-chain/strikes/${index || symbol}`)
            const parseData = await response.json();
            const strikePrices = parseData
            setStrikePrices(strikePrices)
        } catch (error) {
            console.error(error);
            throw new Error('Error fetching strike prices');
        }
    };
    const fetchSpotLTP = async () => {
        const apiUrl = `${process.env.MAIN_URL}/api/v3/records/index/${index || symbol}`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch spot LTP. Status: ${response.status}`);
            }
            const parsedData = await response.json();
            if (!parsedData || !parsedData.candles) {
                throw new Error("Invalid data format received from the server");
            }
            setspotLTP(parsedData.candles);
        } catch (error) {
            console.error(`Error fetching spot LTP: ${error.message}`);
        }
    };
    const fetchFuturesData = async () => {
        try {
            const apiUrl = `${process.env.MAIN_URL}/api/v3/futures/${index || symbol}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Error fetching futures data for ${index || symbol}`);
            }
            const data = await response.json();
            const newData = data.d
            setfuturesData(newData);
        } catch (error) {
            console.error(error);
        }
    };
    const handleIndexChange = (event) => {
        const newIndex = event.target.value;
        if (index === '' && newIndex !== '') {
            setSymbol('');
        }
        setstockDataCE([])
        setstockDataPE([])
        setspotLTP([])
        setselectedStrikePrice('')
        setrecordStockDataCE('')
        setrecordStockDataPE('')
        setLoading(true)
        setIndex(newIndex);
    }
    const handleSymbolChange = (event) => {
        const newSymbol = event.target.value;
        if (symbol === '' && newSymbol !== '') {
            setIndex('');
        }
        setstockDataCE([])
        setstockDataPE([])
        setspotLTP([])
        setselectedStrikePrice('')
        setrecordStockDataCE('')
        setrecordStockDataPE('')
        setLoading(true)
        setSymbol(newSymbol);
    };
    const handleStrikeChange = async (event) => {
        const eventValue = event.target.value
        setselectedStrikePrice([eventValue])
        if (eventValue === '') {
            setrecordStockDataCE('')
            setrecordStockDataPE('')
            setselectedStrikePrice('')
            // fetchStrikePrices()
            console.log("If eventValue === '", selectedStrikePrice);
        }

        if (eventValue != '') {
            try {
                const responseCE = await fetch(`${process.env.MAIN_URL}/api/v3/records/ce/${index || symbol}/${eventValue}`);
                const responsePE = await fetch(`${process.env.MAIN_URL}/api/v3/records/pe/${index || symbol}/${eventValue}`);
                if (!responseCE.ok && !responsePE.ok) {
                    throw new Error(`Failed to fetch Records: ${response.status}`);
                }
                const parsedDataCE = await responseCE.json();
                const parsedDataPE = await responsePE.json();
                setrecordStockDataCE(parsedDataCE.candles);
                setrecordStockDataPE(parsedDataPE.candles);
            } catch (error) {
                console.error(`Error fetching Records ${error.message}`);
            }
        }
    }
    const handleTimeDurationChange = (event) => {
        const selectedTime = event.target.value
        console.log(selectedTime);
        settimeupdateduration(selectedTime)
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
        const date = new Date(epochTime * 1000); // Convert seconds to milliseconds
        const options = { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric' };

        const istFormatter = new Intl.DateTimeFormat('en-IN', options);
        const istDateString = istFormatter.format(date);

        return istDateString;
    }
    const getSymbol = () => {
        const symbols = [];
        // Assuming all arrays have the same length
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
                // then symbol will be (M)
                symbols.push("M");
            } else if (
                spotLTP_first_value < spotLTP_second_value &&
                CE_first_value > CE_second_value
            ) {
                // then symbol will be (M)
                symbols.push("M");
            } else if (
                spotLTP_first_value < spotLTP_second_value &&
                CE_first_value > CE_second_value &&
                PE_first_value < PE_second_value
            ) {
                // then symbol will be (M2)
                symbols.push("M2");
            } else if (
                spotLTP_first_value > spotLTP_second_value &&
                CE_first_value < CE_second_value
            ) {
                // then symbol will be -> T
                symbols.push("T");
            } else if (
                spotLTP_first_value > spotLTP_second_value &&
                PE_first_value < PE_second_value
            ) {
                // then symbol will be -> T
                symbols.push("T");
            } else if (
                spotLTP_first_value > spotLTP_second_value &&
                CE_first_value < CE_second_value &&
                PE_first_value < PE_second_value
            ) {
                // then symbol will be -> T2
                symbols.push("T2");
            }
        }

        setComparisionSymbolMandT(symbols);
    }
    useEffect(() => {
        const mainDataFunctions = async () => {
            await Promise.all([
                fetchRealTimeData(),
                fetchSpotLTP(),
                fetchFuturesData(),
                fetchStrikePrices()
            ]);
            if (recordStockDataCE != '') {
                getSymbol();
            }
        };
        mainDataFunctions();
        const intervalId = setInterval(mainDataFunctions, timeupdateduration);
        return () => {
            clearInterval(intervalId);
        };
    }, [index, symbol, timeupdateduration, spotLTP, recordStockDataCE, recordStockDataPE]);

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
                                <select style={{ width: "153px" }} id="expiryDropdown" className="border rounded p-2"
                                >
                                    <option value="">--Select--</option>
                                    <option value="04-Jan-2024">04-Jan-2024</option>
                                    <option value="11-Jan-2024">11-Jan-2024</option>
                                    <option value="18-Jan-2024">18-Jan-2024</option>
                                    <option value="25-Jan-2024">25-Jan-2024</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-700" htmlFor="strikeDropdown">
                                    Select Strike Price:
                                </label>
                                <select style={{ width: '153px' }} id="strikeDropdown" className="border rounded p-2"
                                    value={selectedStrikePrice} onChange={handleStrikeChange}>
                                    <option value="">--Reset--</option>
                                    {strikePrices.map(strike => (
                                        <option key={strike} value={strike}>
                                            {strike}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-700" htmlFor="strikeDropdown">
                                    Time Duration:
                                </label>
                                <select style={{ width: "153px" }} id="timeDropdown" className="border rounded p-2"
                                    value={timeupdateduration} onChange={handleTimeDurationChange}>
                                    <option value="60000">--Select--</option>
                                    <option value="60000">1 Minute</option>
                                    <option value="120000">2 Minute</option>
                                    <option value="180000">3 Minute</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex">
                        <div className="container w-full flex items-start justify-start h-5 m-2 ">
                            {loading &&
                                <Loading />}
                            {!loading && spotLTP[0] && (
                                <h2 className="text-base text-gray-600 inline-block font-bold  h-5 mb-2">
                                    {formatEpochTimeToIST(spotLTP[0][0])}</h2>
                            )}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <div className="flex justify-between">
                            <div className="table-container w-1/6">
                                <div className="max-h-96 overflow-y-auto">
                                    <table className="table-auto w-full border bg-white shadow-md rounded-md">
                                        <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                            <tr>
                                                <th className="px-4 py-2 text-center border-r">Time</th>
                                                <th className="px-4 py-2 text-center border-r">Spot/LTP</th>
                                            </tr>
                                        </thead>
                                        <tbody className='h-full max-h-lvh'>
                                            {spotLTP.map((value, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-center border">{convertEpochToIndiaTime(value[0])}
                                                    </td>
                                                    <td className="px-4 py-2 text-center border">{value[4]}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="table-container w-1/6">
                                <div className="max-h-96 overflow-y-auto">
                                    <table className="table-auto w-full border bg-white shadow-md rounded-md">
                                        <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                            <tr>
                                                <th className="px-4 py-2 text-center border-r">Future Price</th>
                                            </tr>
                                        </thead>
                                        <tbody className='h-full max-h-lvh'>
                                            {futuresData.map((value, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-center border"><span
                                                        className='text-normal text-slate-800'>{value.v.short_name}</span><br />{value.v.lp}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="table-container w-1/6">
                                <div className="max-h-96 overflow-y-auto">
                                    <table className="table-auto w-full border bg-white shadow-md rounded-md">
                                        <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                            <tr>
                                                <th className="px-4 py-2 text-center border-r">Disc/Premium</th>
                                                {/* future ltp - spot ltp */}
                                            </tr>
                                        </thead>
                                        <tbody className='h-full max-h-lvh'>
                                            {spotLTP.map((value, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-center border">{((futuresData[0].v.lp) - (value[4])).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="table-container w-1/6">
                                <div className="max-h-96 overflow-y-auto">
                                    <table className="table-auto w-full border bg-white shadow-md rounded-md">
                                        <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                            <tr>
                                                <th className="px-4 py-2 text-center border-r">STRIKE</th>
                                            </tr>
                                        </thead>
                                        <tbody className='h-full max-h-lvh'>
                                            {(selectedStrikePrice === '' ? strikePrices : selectedStrikePrice).map((value, index) =>
                                            (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-center border">{value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="table-container w-1/6">
                                <div className="max-h-96 overflow-y-auto">
                                    <table className="table-auto w-full border bg-white shadow-md rounded-md">
                                        <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                            <tr>
                                                {recordStockDataCE != '' && <th className="px-4 py-2 text-center border-r">Time</th>
                                                }
                                                <th className="px-4 py-2 text-center border-r">CE/LTP</th>
                                            </tr>
                                        </thead>
                                        <tbody className='h-full max-h-lvh'>
                                            {recordStockDataCE === '' ? (stockDataCE.map((value, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-center border">{value.v.lp}</td>
                                                </tr>
                                            ))) : (recordStockDataCE.map((value, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-center border">{convertEpochToIndiaTime(value[0])}
                                                    </td>
                                                    <td className="px-4 py-2 text-center border">{value[4]}</td>
                                                </tr>
                                            )))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="table-container w-1/6">
                                <div className="max-h-96 overflow-y-auto">
                                    <table className="table-auto w-full border bg-white shadow-md rounded-md">
                                        <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                            <tr>
                                                {recordStockDataPE != '' && <th className="px-4 py-2 text-center border-r">Time</th>
                                                }
                                                <th className="px-4 py-2 text-center border-r">PE/LTP</th>
                                            </tr>
                                        </thead>
                                        <tbody className='h-full max-h-lvh'>
                                            {recordStockDataPE === '' ? (stockDataPE.map((value, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-center border">{value.v.lp}</td>
                                                </tr>
                                            ))) : (recordStockDataPE.map((value, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-center border">{convertEpochToIndiaTime(value[0])}
                                                    </td>
                                                    <td className="px-4 py-2 text-center border">{value[4]}</td>
                                                </tr>
                                            )))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {(recordStockDataCE || recordStockDataPE) != '' && <div className="table-container w-1/6">
                                <div className="max-h-96 overflow-y-auto">
                                    <table className="table-auto w-full border bg-white shadow-md rounded-md">
                                        <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                            <tr>
                                                <th className="px-4 py-2 text-center border-r">Symbols</th>
                                            </tr>
                                        </thead>
                                        <tbody className='h-full max-h-lvh'>
                                            {ComparisionSymbolMandT.map((value, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-center border"><span className='text-slate-800 mr-12'>{index + 1}:-&gt;</span>{ComparisionSymbolMandT[index]}</td>
                                                </tr>
                                            ))}

                                        </tbody>
                                    </table>
                                </div>
                            </div>}
                        </div>
                    </div>
                </main>
                <footer className="text-black mt-20">
                    <section className="bg-gray-100 py-16">
                        <div className="container mx-auto text-center">
                            <h2 className="text-3xl font-bold mb-4">Analyze Historical Data</h2>
                            <p className="text-lg mb-6">Explore a chronological record of your interactions and discoveries.
                                Revisit and analyze your past views to gain insights and make informed decisions.</p>
                            <Link href="/records">
                                <Purplebutton data="View records" />
                            </Link>
                            <Link href="/dashboard">
                                <Purplebutton data="Explore Dashboard" />
                            </Link>
                        </div>
                    </section>
                </footer>
            </div>
        </>
    );
};


export default Page;