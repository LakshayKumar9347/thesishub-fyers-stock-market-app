"use client"
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import Loading from '../components/Loading';
import PurpleButton from '../components/Purplebutton';

// Component definition
const Page = () => {
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [stockData, setStockData] = useState([]);
    const [symbol, setSymbol] = useState('');
    const [index, setIndex] = useState('nifty');

    // Fetch real-time data from the server
    const fetchRealTimeData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`https://thesishub.in/marketfeed/records/history/${index || symbol}/${selectedDate}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch data. HTTP error! Status: ${response.status}`);
            }

            const parsedData = await response.json(); // Await the parsing of JSON response
            //console.log(parsedData.candles); // Verify the parsed data in console

            // Set the stock data state variable with the parsed data
            setStockData(parsedData.candles);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching real-time data:', error);
            setLoading(false);
        }
    };
    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };
    // console.log(stockData);
    const handleIndexChange = (event) => {
        const newIndex = event.target.value;

        if (index === '' && newIndex !== '') {
            setSymbol('nifty');
        }

        setStockData([]);
        setLoading(true);
        setIndex(newIndex);
    };

    const handleSymbolChange = (event) => {
        const newSymbol = event.target.value;

        if (symbol === '' && newSymbol !== '') {
            setIndex('');
        }

        setStockData([]);
        setLoading(true);
        setSymbol(newSymbol);
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
    useEffect(() => {
        fetchRealTimeData();
    }, [index, symbol, selectedDate]);

    return (
        <>
            <Navbar />
            <div className='flex flex-col min-h-screen'>
                <main className="container mx-auto mt-7 grow">
                    <div className="flex justify-between mb-5">
                        <div>
                            <h2 className="text-gray-700 text-3xl font-semibold">Stock Data Records</h2>
                        </div>
                        <div className="flex space-x-4">
                            <div>
                                <label className="text-gray-700 mx-1" htmlFor="indexDropdown">
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
                                <label className="text-gray-700 mx-1" htmlFor="symbolDropdown">
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
                        </div>
                    </div>
                    {/* Show Current Date */}
                    <div className="flex justify-between">
                        <div className="container w-full flex items-start justify-start h-5 m-2">
                            <h2 className="text-base text-gray-600 inline-block font-bold mb-2">
                                {stockData.length > 0 && formatEpochTimeToIST(stockData[0][0])}
                            </h2>
                        </div>
                        <div className="container w-full flex items-start justify-end h-5 m-2">
                            {loading && <Loading />}
                        </div>
                    </div>
                    {/* Choose Date Option */}
                    <div className="flex justify-end">
                        <div className='mb-3'>
                            <label className="text-gray-700" htmlFor="datePicker">
                                Choose a Date:
                            </label>
                            <input
                                type="date"
                                id="datePicker"
                                className="border border-gray-400 rounded p-1 ml-2 text-sm"
                                onChange={handleDateChange}
                            />
                        </div>
                    </div>

                    <div className="table-container">
                        <div className="max-h-96 overflow-y-auto">
                            <table className="table-auto w-full border bord bg-white shadow-md rounded-md ">
                                <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                    <tr>
                                        <th className="px-4 py-2 text-center border-r">Time</th>
                                        <th className="px-4 py-2 text-center border-r">Open Value</th>
                                        <th className="px-4 py-2 text-center border-r">Highest Value</th>
                                        <th className="px-4 py-2 text-center border-r">Lowest Value</th>
                                        <th className="px-4 py-2 text-center border-r">Close Value</th>
                                        {/* <th className="px-4 py-2 text-center">Volume</th> */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {!loading && stockData.map((dataRow, index) => (
                                        <tr key={index} className="border">
                                            <td className="px-4 py-2 text-center border">{convertEpochToIndiaTime(dataRow[0])}</td>
                                            <td className="px-4 py-2 text-center border-r">{dataRow[1]}</td>
                                            <td className="px-4 py-2 text-center border-r">{dataRow[2]}</td>
                                            <td className="px-4 py-2 text-center border-r">{dataRow[3]}</td>
                                            <td className="px-4 py-2 text-center border-r">{dataRow[4]}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>

                <footer>
                    <section className="bg-gray-100 py-16">
                        <div className="container mx-auto text-center">
                            <h2 className="text-3xl font-bold mb-4">Real-Time Stock Updates</h2>
                            <p className="text-lg mb-6">Stay informed with the latest stock market data. Explore real-time
                                updates, analyze market trends, and make informed decisions for your investments.</p>
                            <Link href="/dashboard">
                                <PurpleButton data="Explore Dashboard" />
                            </Link>
                            <Link href="/history">
                                <PurpleButton data="View History" />
                            </Link>
                        </div>
                    </section>
                </footer>
            </div>
        </>
    );
};

export default Page;