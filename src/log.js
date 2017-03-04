module.exports = (message) => {
    const currentDate = new Date;
    const currentDateString = `${currentDate.getDate()}-${(currentDate.getMonth() + 1)}-${currentDate.getFullYear()}`;
    const currentTimeString = currentDate.toTimeString().substring(0, currentDate.toTimeString().length - 6);

    console.log(`[${currentDateString} ${currentTimeString}] ${message}`);
};
