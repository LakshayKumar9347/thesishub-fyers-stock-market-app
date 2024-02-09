// Error Handling
function handleFyersError(err) {
    if (err instanceof Error && err.message.includes("access_token has expired")) {
        console.error("Access token has expired. Please refresh the token and update the application.");
    } else {
        console.error("Fyers API Error:", err);
    }
}

module.exports = handleFyersError;
