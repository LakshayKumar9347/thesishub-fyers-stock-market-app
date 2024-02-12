"use client"

import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

const Navbar = () => {
    const [price, setprice] = useState('')
    const fetchPrice = async (symbol) => {
        try {
            const response = await fetch(`https://thesishub.in/marketfeed/api/v3/ticker/${symbol}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const jsonData = await response.json();
            setprice(jsonData.d[0].v.lp);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }
    useEffect(() => {
        fetchPrice('nifty');
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
                    {/* <span className="text-white text-3xl  font-sans  font-bold tracking-wide ">National Stock Exchange</span> */}
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