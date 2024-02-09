io.on('connection', (socket) => {
    function onmsg(message) {
        socket.emit('message', message);
    }

    function onconnect(symbol) {
        fyersdata.subscribe([symbol]);
        fyersdata.autoreconnect();
    }

    function onerror(err) {
        console.error(err, handleFyersError);
    }

    function onclose(symbol) {
        console.log(`Socket closed for ${symbol}`);
    }

    fyersdata.on("message", onmsg);
    fyersdata.on("connect", onconnect);
    fyersdata.on("error", onerror);
    fyersdata.on("close", onclose);

    try {
        fyersdata.connect();
    } catch (err) {
        handleFyersError(err);
    }

    socket.on('symbol', async (userFriendlySymbol) => {
        const stockSymbol = stockSymbols[userFriendlySymbol];
        if (stockSymbol) {
            try {
                const response = await axios.get(`http://localhost:5000/api/v3/ticker/${userFriendlySymbol}`);
                const ltp = response.data.d[0].v.lp;
                const roundedLTP = calculateRoundedLTP(ltp, userFriendlySymbol);
                const totalStrikePrice = 9
                const strikePrices = generateStrikePrices(roundedLTP, totalStrikePrice, userFriendlySymbol);

                onconnect([stockSymbol, ...strikePrices]);

            } catch (error) {
                console.error(`Error fetching ticker for ${userFriendlySymbol}:`, error);
            }
        } else {
            console.log(`Invalid symbol: ${userFriendlySymbol}`);
        }
    });

    socket.on('disconnect', () => {
        const userFriendlySymbol = socket.userFriendlySymbol;
        if (userFriendlySymbol) {
            const stockSymbol = stockSymbols[userFriendlySymbol];
            onclose(stockSymbol);
            fyersdata.unsubscribe([stockSymbol]);
        }
    });
});