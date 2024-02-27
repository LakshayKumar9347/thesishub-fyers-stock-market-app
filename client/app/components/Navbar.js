"use client"
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

const Navbar = () => {
    const [price, setprice] = useState('')
    const fetchPrice = async () => {
        const date = new Date()
        const userdate = formatDate(date)
        // console.log(userdate);
        try {
            const response = await fetch(`/marketfeed/api/v3/ticker/nifty/${userdate}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const jsonData = await response.json();
            // console.log(jsonData.candles[0][4]);
            setprice(jsonData.candles[0][4]);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }
    function formatDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    useEffect(() => {
        fetchPrice();
    }, []);
    return (
        <header className="bg-gradient-to-r from-indigo-500 to-indigo-800 py-4">
            <div className="container mx-auto flex justify-between items-center">
                {/* NSE Logo */}
                <div className="flex items-center">
                    <Image
                        src="https://www.nseindia.com/assets/images/NSE_Logo.svg"
                        alt="NSE Logo"
                        className=" mr-2"
                        width={150}
                        height={200}
                    />
                </div>
                <div className="flex items-center p-2">
                    <Image
                        src="/Nifty50.jpg"
                        alt="NIFTY Logo"
                        className="h-10 w-13 mr-2 rounded object-cover"
                        width={100}
                        height={100}
                    />
                    <span className="text-white text-lg font-semibold font-sans">
                        ₹{parseFloat(price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>

                </div>

                {/* Navigation Button */}
                <Link href="/">
                    <span className="bg-white text-black px-6 py-2 inline-block rounded-full font-semibold hover:bg-indigo-300 hover:text-white transition duration-300">
                        Go to Home
                    </span>
                </Link>
            </div>
        </header>
    )
}

export default Navbar