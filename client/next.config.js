/** @type {import('next').NextConfig} */
require('dotenv').config();

const nextConfig = {
    output: 'export',
    images: { unoptimized: true } 
}

module.exports = nextConfig
