"use client"
import React, { useEffect, useState } from 'react';
import '.././globals.css';
import Navbar from '../components/Navbar';
import Purplebutton from '../components/Purplebutton';
import Link from 'next/link';
import Loading from '../components/Loading';
// import { io } from 'socket.io-client';

const Page = () => {
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState([]);
    const [spotLTP, setspotLTP] = useState([])
    const [stockDataCE, setstockDataCE] = useState([]);
    const [stockDataPE, setstockDataPE] = useState([]);
    const [futuresData, setfuturesData] = useState([])
    const [strikePrices, setStrikePrices] = useState([])
    const [symbol, setSymbol] = useState('');
    const [index, setIndex] = useState('nifty')

    const fetchRealTimeData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/v3/option-chain/${index || symbol}`);

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
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/v3/option-chain/strikes/${index || symbol}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch strike prices. HTTP Status: ${response.status}`);
            }

            const parseData = await response.json();
            const strikePrices = parseData || [];
            setStrikePrices(strikePrices);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
            throw new Error('Error fetching strike prices');
        }
    };
    const fetchSpotLTP = async () => {
        const apiUrl = `http://localhost:5000/api/v3/ticker/${index || symbol}`;

        try {
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`Error fetching spot LTP for ${index || symbol}`);
            }

            const data = await response.json();
            const spotLTP = data.d[0].v.lp;

            // Update the state to include the new spotLTP and the previous data
            setspotLTP(prevSpotLTPArray => [spotLTP, ...prevSpotLTPArray]);
        } catch (error) {
            throw new Error(`Error fetching spot LTP for ${index || symbol}`);
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
            const newData = data.d
            setfuturesData(newData);
        } catch (error) {
            console.error(error);
        }
    };
    const handleIndexChange = (event) => {
        const newIndex = event.target.value;
        if (index === '' && newIndex !== '') {
            setSymbol('nifty');
        }
        setstockDataCE([])
        setspotLTP([])
        setCurrentTime([])
        setLoading(true)
        setIndex(newIndex);
    }
    const handleSymbolChange = (event) => {
        const newSymbol = event.target.value;
        if (symbol === '' && newSymbol !== '') {
            setIndex('');
        }
        setstockDataCE([])
        setspotLTP([])
        setCurrentTime([])
        setLoading(true)
        setSymbol(newSymbol);
    };
    // Epoch Time FUcntion in Utils
    // Main Data Updation Function With 30 Seconds Timeframe
    useEffect(() => {
        const mainDataFunctions = async () => {
            await Promise.all([
                fetchRealTimeData(),
                fetchSpotLTP(),
                fetchFuturesData(),
                fetchStrikePrices(),
            ]);
        };
        mainDataFunctions();
        const intervalId = setInterval(mainDataFunctions, 7000);
        return () => {
            clearInterval(intervalId);
        };
    }, [index, symbol]);
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
                                <select style={{ width: '153px' }} id="indexDropdown" className="border rounded p-2"
                                    value={index} onChange={handleIndexChange}>
                                    <option value="">--Select--</option>
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
                                    <option value="">--Select--</option>
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
                                    defaultValue="select">
                                    <option value="">--Select--</option>
                                    <option value="04-Jan-2024">04-Jan-2024</option>
                                    <option value="11-Jan-2024">11-Jan-2024</option>
                                    <option value="18-Jan-2024">18-Jan-2024</option>
                                    <option value="25-Jan-2024">25-Jan-2024</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-700" htmlFor="strikeDropdown">Select Strike Price:</label>
                                <select style={{ width: "153px" }} id="strikeDropdown" className="border rounded p-2"
                                    defaultValue="select">
                                    <option value="">--Select--</option>
                                    <option value="21800">21800</option>
                                    <option value="21900">21900</option>
                                    <option value="22000">22000</option>
                                    <option value="22100">22100</option>
                                    <option value="22200">22200</option>
                                    <option value="22300">22300</option>
                                    <option value="22400">22400</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="container w-full flex items-center justify-start h-5 m-2 ">
                        {loading &&
                            <Loading />}
                    </div>
                    <div className="flex justify-between">
                        <div className="table-container w-1/4">
                            <div className="max-h-96 overflow-y-auto">
                                <table className="table-auto w-full border bg-white shadow-md rounded-md">
                                    <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                        <tr>
                                            <th className="px-4 py-2 text-center border-r">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className='h-full max-h-lvh'>
                                            <tr >
                                                <td className="px-4 py-2 text-center border">time</td>
                                            </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="table-container w-1/4">
                            <div className="max-h-96 overflow-y-auto">
                                <table className="table-auto w-full border bg-white shadow-md rounded-md">
                                    <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                        <tr>
                                            <th className="px-4 py-2 text-center border-r">Spot/LTP</th>
                                        </tr>
                                    </thead>
                                    <tbody className='h-full max-h-lvh'>
                                        {spotLTP.slice(1).map((value, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2 text-center border">{value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="table-container w-1/4">
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
                                                <td className="px-4 py-2 text-center border">{value.v.short_name}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="table-container w-1/4">
                            <div className="max-h-96 overflow-y-auto">
                                <table className="table-auto w-full border bg-white shadow-md rounded-md">
                                    <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                        <tr>
                                            <th className="px-4 py-2 text-center border-r">Disc/Premium</th>
                                        </tr>
                                    </thead>
                                    <tbody className='h-full max-h-lvh'>
                                        {futuresData.map((value, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2 text-center border">{value.v.lp}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="table-container w-1/4">
                            <div className="max-h-96 overflow-y-auto">
                                <table className="table-auto w-full border bg-white shadow-md rounded-md">
                                    <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                        <tr>
                                            <th className="px-4 py-2 text-center border-r">STRIKE</th>
                                        </tr>
                                    </thead>
                                    <tbody className='h-full max-h-lvh'>
                                        {strikePrices.map((value, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2 text-center border">{value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="table-container w-1/4">
                            <div className="max-h-96 overflow-y-auto">
                                <table className="table-auto w-full border bg-white shadow-md rounded-md">
                                    <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                        <tr>
                                            <th className="px-4 py-2 text-center border-r">CE/LTP</th>
                                        </tr>
                                    </thead>
                                    <tbody className='h-full max-h-lvh'>
                                        {stockDataCE.map((value, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2 text-center border">{value.v.lp}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="table-container w-1/4">
                            <div className="max-h-96 overflow-y-auto">
                                <table className="table-auto w-full border bg-white shadow-md rounded-md">
                                    <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                        <tr>
                                            <th className="px-4 py-2 text-center border-r">PE/LTP</th>
                                        </tr>
                                    </thead>
                                    <tbody className='h-full max-h-lvh'>
                                        {stockDataPE.map((value, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2 text-center border">{value.v.lp}</td>
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
                                <Purplebutton data="Go to History" />
                            </Link>
                            <Link href="/records">
                                <Purplebutton data="View records" />
                            </Link>
                        </div>
                    </section>
                </footer>
            </div>
        </>
    );
};


export default Page;