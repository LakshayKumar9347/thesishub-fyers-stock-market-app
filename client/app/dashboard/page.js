"use client"
import React, { useEffect, useState } from 'react'
import { Carousel, IconButton } from "@material-tailwind/react";
import Navbar from '../components/Navbar'
import Tableone from '../components/Tableone';
import Tabletwo from '../components/Tabletwo';
import Tablethree from '../components/Tablethree'
import Footer from '../components/Footer'
import io from 'socket.io-client';
// import axios from 'axios';


const page = () => {
    const [webSocketSymbolsData, setwebSocketSymbolsData] = useState([])

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
    const FetchDataFromWebSocket = async () => {
        let socket;
        try {
            const socket = io(`${process.env.NEXT_PUBLIC_WS_URL}`, {
                path: '/socket.io',
            });
            socket.on('symbolData', (data) => {
                const indianTime = convertEpochToIndiaTime(data.exch_feed_time);
                setwebSocketSymbolsData((prevData) => {
                    const newData = [
                        ...prevData,
                        { symbol: data.symbol, ltp: data.ltp, exch_feed_time: data.exch_feed_time, indian_time: indianTime }
                    ];
                    return newData;
                });
            });
            return () => {
                if (socket && socket.connected) {
                    socket.emit('disconnect');
                    socket.close();
                }
            };
        } catch (error) {
            console.error(`Error fetching Data From WebSocket: ${error.message}`);
            if (socket && socket.connected) {
                socket.close();
            }
        }
    };
    // console.log(webSocketSymbolsData);
    useEffect(() => {
        FetchDataFromWebSocket()
    }, [])
    return (
        <>
            <Navbar />
            <section className='min-h-screen flex flex-col'>
                <main class="flex-grow">
                    <Carousel className="rounded-xl" prevArrow={({ handlePrev }) => (
                        <IconButton variant="text" color="black" size="lg" onClick={handlePrev}
                            className="!absolute top-2/4 left-4 -translate-y-2/4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2}
                                stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                        </IconButton>
                    )}
                        nextArrow={({ handleNext }) => (
                            <IconButton variant="text" color="black" size="lg" onClick={handleNext}
                                className="!absolute top-2/4 !right-4 -translate-y-2/4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2}
                                    stroke="currentColor" className="h-6 w-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </IconButton>
                        )}
                    >
                        <Tableone webSocketSymbolsData={webSocketSymbolsData} />
                        <Tabletwo webSocketSymbolsData={webSocketSymbolsData} />
                        <Tablethree webSocketSymbolsData={webSocketSymbolsData} />
                    </Carousel>
                </main>


                {/* <Tabletwo /> */}
                <Footer />
            </section>
        </>
    )
}

export default page