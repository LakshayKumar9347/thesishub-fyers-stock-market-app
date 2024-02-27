"use client"
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import Loading from '../components/Loading';
import PurpleButton from '../components/Purplebutton';

// Component definition
const Page = () => {
    const [loading, setLoading] = useState(true);
    const [stockData, setStockData] = useState([]);
    const [symbol, setSymbol] = useState('');
    const [index, setIndex] = useState('nifty');

    const fetchRealTimeData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/marketfeed/db/history/${index || symbol}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch data. HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();

            if (responseData.success) {
                // Extract the 'data' array from the response
                const dataArray = responseData.data || [];
                setStockData(dataArray);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching real-time data:', error);
            setLoading(false);
        }
    };
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
    function convertEpochToIndiaDate(epochTimestamp) {
        const epochMillis = epochTimestamp * 1000;
        const date = new Date(epochMillis);
        const options = {
            timeZone: 'Asia/Kolkata',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        };
        const indiaDate = date.toLocaleString('en-IN', options);

        return indiaDate;
    }

    useEffect(() => {
        fetchRealTimeData();
    }, [index, symbol]);

    return (
        <>
            <Navbar />
            <div className='flex flex-col min-h-screen'>
                <main className="container mx-auto mt-7 grow">
                    <div className="flex justify-between mb-5">
                        <div>
                            <h2 className="text-gray-700 text-3xl font-semibold">Historical Stock Data</h2>
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

                    <div className="table-container">
                        <div className="max-h-96 overflow-y-auto">
                            <table className="table-auto w-full border bord bg-white shadow-md rounded-md ">
                                <thead className="bg-gray-800 text-white sticky top-0 z-50">
                                    <tr>
                                        <th className="px-4 py-2 text-center border-r">Date</th>
                                        <th className="px-4 py-2 text-center border-r">Open Value</th>
                                        <th className="px-4 py-2 text-center border-r">Highest Value</th>
                                        <th className="px-4 py-2 text-center border-r">Lowest Value</th>
                                        <th className="px-4 py-2 text-center border-r">Close Value</th>
                                        {/* <th className="px-4 py-2 text-center">Volume</th> */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {!loading && stockData.map((rowData, index) => (
                                        <tr key={index} className="border">
                                            <td className="px-4 py-2 text-center border">{convertEpochToIndiaDate(rowData[0])}</td>
                                            <td className="px-4 py-2 text-center border-r">{rowData[1].toLocaleString('en-IN', {
                                                maximumFractionDigits: 2
                                            })}</td>
                                            <td className="px-4 py-2 text-center border-r">{rowData[2].toLocaleString('en-IN', {
                                                maximumFractionDigits: 2
                                            })}</td>
                                            <td className="px-4 py-2 text-center border-r">{rowData[3].toLocaleString('en-IN', {
                                                maximumFractionDigits: 2
                                            })}</td>
                                            <td className="px-4 py-2 text-center border-r">{rowData[4].toLocaleString('en-IN', {
                                                maximumFractionDigits: 2
                                            })}</td>
                                            {/* Add similar formatting for other numeric values if needed */}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="container m-9 text-center flex justify-center">
                        {loading &&
                            <Loading />}
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
                            <Link href="/records">
                                <PurpleButton data="Analyze Stock Records" />
                            </Link>
                        </div>
                    </section>
                </footer>
            </div>
        </>
    );
};

export default Page;