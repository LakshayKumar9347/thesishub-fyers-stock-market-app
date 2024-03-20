"use client"
import React from 'react'
import Link from 'next/link'
import Purplebutton from '../components/Purplebutton'
const Footer = () => {
    return (
        <footer className=" text-black mt-20">
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
        )
}

export default Footer;