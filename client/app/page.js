"use client"

import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Purplebutton from './components/Purplebutton';

const Home = () => {

  return (
    <div>
      <Head>
        <title>Stock Monitoring Dashboard</title>
        <meta name="description" content="Track stock quotes for better financial insights." />
        <link rel='icon' href='/vercel.svg' />
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-500 to-indigo-800 text-white py-16">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Stock Monitoring Dashboard</h1>
          <p className="text-lg">Stay updated with real-time stock quotes and financial data.</p>
          <Link className='mx-2' href="/dashboard">
            <span className="bg-white text-black px-6 py-2 mt-8 inline-block rounded-full font-semibold hover:bg-indigo-300 hover:text-white transition duration-300">
              Explore Dashboard
            </span>
          </Link>
          <Link className='mx-2' href="/history">
            <span className="bg-white text-black px-6 py-2 mt-8 inline-block rounded-full font-semibold hover:bg-indigo-300 hover:text-white transition duration-300">View Historical Data</span>
          </Link>
          <Link className='mx-2' href="/records">
            <span className="bg-white text-black px-6 py-2 mt-8 inline-block rounded-full font-semibold hover:bg-indigo-300 hover:text-white transition duration-300">Analyze Stock Records</span>
          </Link>

          {/* <Link className='mx-2' href="/records">
            <span className="bg-white text-black px-6 py-2 mt-8 inline-block rounded-full font-semibold hover:bg-indigo-300 hover:text-white transition duration-300">View Records</span>
          </Link> */}

        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <span className="flex justify-between ">
                <h2 className="text-2xl font-bold mb-4">Real-time Data</h2>
                <Image className='object-contain' src="/bar-chart_5569835.png" alt='Not Found' width={40} height={70}></Image>
              </span>

              <p>Get instant updates on stock quotes, Last Trade Price (LTP), Call and Put Option data, and Open Interest (OI).</p>

            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <span className="flex justify-between">
                <h2 className="text-2xl font-bold mb-4">User-friendly Interface</h2>
                <Image className='object-contain' src="/user-interface.png" alt='Not Found' width={40} height={70}></Image>
              </span>
              <p>Our intuitive dashboard is designed for easy navigation and quick access to essential financial information.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <span className="flex justify-between">
                <h2 className="text-2xl font-bold mb-4">Customized Alerts</h2>
                <Image className='object-contain' src="/notification-bell.png" alt='Not Found' width={40} height={70}></Image>
              </span>
              <p>Set personalized alerts based on specific stock conditions to receive timely notifications.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Need Assistance?</h2>
          <p className="text-lg mb-6">Experience seamless support; contact us for personalized insights and a better website journey.</p>
          <Link href="https://www.rgstartup.com/contact/">
            <Purplebutton data="Contact Us" />
          </Link>
        </div>
      </section>
    </div>

  );
};

export default Home;
