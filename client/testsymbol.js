<div className="flex justify-between">
    <div className="table-container w-1/6">
        <div className="max-h-96 overflow-y-auto">
            <table className="table-auto w-full border bg-white shadow-md rounded-md">
                <thead className="bg-gray-800 text-white sticky top-0 z-50">
                    <tr>
                        <th className="px-4 py-2 text-center border-r">Time</th>
                        <th className="px-4 py-2 text-center border-r">Spot/LTP</th>
                    </tr>
                </thead>
                <tbody className='h-full max-h-lvh'>
                    {spotLTP.map((value, index) => (
                        <tr key={index}>
                            <td className="px-4 py-2 text-center border">{convertEpochToIndiaTime(value[0])}
                            </td>
                            <td className="px-4 py-2 text-center border">{value[4]}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
    <div className="table-container w-1/6">
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
                            <td className="px-4 py-2 text-center border"><span
                                className='text-normal text-slate-800'>{value.v.short_name}</span><br />{value.v.lp}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
    <div className="table-container w-1/6">
        <div className="max-h-96 overflow-y-auto">
            <table className="table-auto w-full border bg-white shadow-md rounded-md">
                <thead className="bg-gray-800 text-white sticky top-0 z-50">
                    <tr>
                        <th className="px-4 py-2 text-center border-r">Disc/Premium</th>
                        {/* future ltp - spot ltp */}
                    </tr>
                </thead>
                <tbody className='h-full max-h-lvh'>
                    {spotLTP.map((value, index) => (
                        <tr key={index}>
                            <td className="px-4 py-2 text-center border">{((futuresData[0].v.lp) - (value[4])).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
    <div className="table-container w-1/6">
        <div className="max-h-96 overflow-y-auto">
            <table className="table-auto w-full border bg-white shadow-md rounded-md">
                <thead className="bg-gray-800 text-white sticky top-0 z-50">
                    <tr>
                        <th className="px-4 py-2 text-center border-r">STRIKE</th>
                    </tr>
                </thead>
                <tbody className='h-full max-h-lvh'>
                    {(selectedStrikePrice === '' ? strikePrices : selectedStrikePrice).map((value, index) =>
                    (
                        <tr key={index}>
                            <td className="px-4 py-2 text-center border">{value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
    <div className="table-container w-1/6">
        <div className="max-h-96 overflow-y-auto">
            <table className="table-auto w-full border bg-white shadow-md rounded-md">
                <thead className="bg-gray-800 text-white sticky top-0 z-50">
                    <tr>
                        {recordStockDataCE !== '' && <th className="px-4 py-2 text-center border-r">Time
                        </th>}
                        <th className="px-4 py-2 text-center border-r">CE/LTP</th>
                    </tr>
                </thead>
                <tbody className='h-full max-h-lvh'>
                    {recordStockDataCE === '' ? (stockDataCE.map((value, index) => (
                        <tr key={index}>
                            <td className="px-4 py-2 text-center border">{value.v.lp}</td>
                        </tr>
                    ))) : (recordStockDataCE.map((value, index) => (
                        <tr key={index}>
                            <td className="px-4 py-2 text-center border">{convertEpochToIndiaTime(value[0])}
                            </td>
                            <td className="px-4 py-2 text-center border">{value[4]}</td>
                        </tr>
                    )))}
                </tbody>
            </table>
        </div>
    </div>
    <div className="table-container w-1/6">
        <div className="max-h-96 overflow-y-auto">
            <table className="table-auto w-full border bg-white shadow-md rounded-md">
                <thead className="bg-gray-800 text-white sticky top-0 z-50">
                    <tr>
                        {recordStockDataPE != '' && <th className="px-4 py-2 text-center border-r">Time</th>
                        }
                        <th className="px-4 py-2 text-center border-r">PE/LTP</th>
                    </tr>
                </thead>
                <tbody className='h-full max-h-lvh'>
                    {recordStockDataPE === '' ? (stockDataPE.map((value, index) => (
                        <tr key={index}>
                            <td className="px-4 py-2 text-center border">{value.v.lp}</td>
                        </tr>
                    ))) : (recordStockDataPE.map((value, index) => (
                        <tr key={index}>
                            <td className="px-4 py-2 text-center border">{convertEpochToIndiaTime(value[0])}
                            </td>
                            <td className="px-4 py-2 text-center border">{value[4]}</td>
                        </tr>
                    )))}
                </tbody>
            </table>
        </div>
    </div>
    <div className="table-container w-1/6">
        <div className="max-h-96 overflow-y-auto">
            <table className="table-auto w-full border bg-white shadow-md rounded-md">
                <thead className="bg-gray-800 text-white sticky top-0 z-50">
                    <tr>
                        {recordStockDataPE === '' && <th className="px-4 py-2 text-center border-r">Time</th>
                        }
                        <th className="px-4 py-2 text-center border-r">Symbols</th>
                    </tr>
                </thead>
                <tbody className='h-full max-h-lvh'>
                    <tr>
                        <td className="px-4 py-2 text-center border">Time</td>
                        <td className="px-4 py-2 text-center border">Symbol</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>