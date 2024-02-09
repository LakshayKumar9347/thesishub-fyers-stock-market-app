<div className="table-container flex justify-center p-4 max-h-full overflow-y-auto ">
<table className="table-fixed border bg-white shadow-md rounded-2xl w-1/5   mx-3 ">
    <thead className="bg-gray-800 text-white sticky top-0 z-50 h-12 overflow-hidden">
        <tr>
            <th className="px-4 py-2 text-center border-r ">Time</th>
        </tr>
    </thead>
    <tbody className='overflow-y-auto'>
        { currentTime.slice(1).map((time, index) => (
            <tr key={index} className="border transition-all ease-in-out duration-300">
                <td className="px-4 py-2 m- text-center border-r">{time}</td>
            </tr>
        ))}
    </tbody>
</table>
<table className="table-auto border bg-white shadow-md rounded-2xl w-1/5   mx-3">
    <thead className="bg-gray-800 text-white sticky top-0 z-50 h-12 overflow-hidden">
        <tr>
            <th className="px-4 py-2 text-center border-r ">Spot/LTP</th>
        </tr>
    </thead>
    <tbody>
        { spotLTP.map((value, index) => (
            <tr key={index} className="border">
                <td className="px-4 py-2 m- text-center border-r">{value}</td>
            </tr>
        ))}
    </tbody>
</table>
<table className="table-auto border bg-white shadow-md rounded-2xl w-1/5   mx-3">
    <thead className="bg-gray-800 text-white sticky top-0 z-50 h-12 overflow-hidden">
        <tr>
            <th className="px-4 py-2 text-center border-r">Future Price</th>
        </tr>
    </thead>
    <tbody>
        {futuresData.map((value, index) => (
            <tr key={index} className="border">
                <td className="px-4 py-2 m- text-center border-r">{value.v.short_name}</td>
            </tr>
        ))}
    </tbody>
</table>                        <table className="table-auto border bg-white shadow-md rounded-2xl w-1/5   mx-3">
    <thead className="bg-gray-800 text-white sticky top-0 z-50 h-12 overflow-hidden">
        <tr>
            <th className="px-4 py-2 text-center border-r">Disc/Premium</th>
        </tr>
    </thead>
    <tbody>
        {futuresData.map((value, index) => (
            <tr key={index} className="border">
                <td className="px-4 py-2 m- text-center border-r">{value.v.lp}</td>
            </tr>
        ))}
    </tbody>
</table>
<table className="table-auto border bg-white shadow-md rounded-2xl w-1/5   mx-3">
    <thead className="bg-gray-800 text-white sticky top-0 z-50 h-12 overflow-hidden">
        <tr>
            <th className="px-4 py-2 text-center border-r">STRIKE</th>
        </tr>
    </thead>
    <tbody>
        {strikePrices.map((value, index) => (
            <tr key={index} className="border">
                <td className="px-4 py-2 m- text-center border-r">{value}</td>
            </tr>
        ))}
    </tbody>
</table>
<table className="table-auto border bg-white shadow-md rounded-2xl w-1/5   mx-3">
    <thead className="bg-gray-800 text-white sticky top-0 z-50 h-12 overflow-hidden">
        <tr>
            <th className="px-4 py-2 text-center border-r">CE/LTP</th>
        </tr>
    </thead>
    <tbody>
        {stockDataCE.map((value, index) => (
            <tr key={index} className="border">
                <td className="px-4 py-2 m- text-center border-r">{value.v.lp}</td>
            </tr>
        ))}
    </tbody>
</table>
<table className="table-auto border bg-white shadow-md rounded-2xl w-1/5   mx-3">
    <thead className="bg-gray-800 text-white sticky top-0 z-50 h-12 overflow-hidden">
        <tr>
            <th className="px-4 py-2 text-center border-r">PE/LTP</th>
        </tr>
    </thead>
    <tbody>
        {stockDataPE.map((value, index) => (
            <tr key={index} className="border">
                <td className="px-4 py-2 m- text-center border-r">{value.v.lp}</td>
            </tr>
        ))}
    </tbody>
</table>
</div>