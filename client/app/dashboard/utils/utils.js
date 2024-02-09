export const fetchStrikePrices = async (symbol, steps) => {
    try {
        const response = await fetch(`http://localhost:5000/api/v3/ticker/${symbol}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const jsonData = await response.json();
        const spotPrice = parseFloat(jsonData.d[0].v.lp);
        const strikePrices = [];
        const step = steps ? steps : 50;
        const numBefore = 20;
        const numAfter = 20;

        for (let i = -numBefore; i <= numAfter; i++) {
            const strike = Math.round((spotPrice + i * step) / step) * step;
            strikePrices.push(strike);
        }
        // console.log('Strike Prices:', strikePrices);
        setStrike(strikePrices);

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


// function convertEpochToIndiaDate(epochTimestamp) {
    //     const epochMillis = epochTimestamp * 1000;
    //     const date = new Date(epochMillis);
    //     const options = {
    //         timeZone: 'Asia/Kolkata',
    //         day: 'numeric',
    //         month: 'short',
    //         year: 'numeric',
    //     };
    //     const indiaDate = date.toLocaleString('en-IN', options);

    //     return indiaDate;
    // }
    // useEffect(() => {
    //     const socketConnection = io('http://localost:5000/');
    //     socketConnection.on('connect', () => {
    //         console.log('Connected to server');
    //     });

    //     socketConnection.on('dataResponse', (responseData) => {
    //         console.log(responseData);
    //     });
    //     return () => {
    //         if (socketConnection) {
    //             socketConnection.disconnect();
    //         }
    //     };
    // }, [])