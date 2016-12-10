// Module exports

module.exports = log;

// Main function

function log(message) {
    var currentDate = new Date;
    var currentDateString = `${currentDate.getDate()}-${(currentDate.getMonth() + 1)}-${currentDate.getFullYear()}`;
    var currentTimeString = currentDate.toTimeString().substring(0, currentDate.toTimeString().length - 6);

    console.log(`[${currentDateString} ${currentTimeString}] ${message}`);
}