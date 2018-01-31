module.exports = {
    log: {

        msg: (message) => {
            console.log(`[MESG] ${message}`);
        },

        start: (message) => {
            console.log(`[STRT] ${message}`);
        },

        end: (message) => {
            console.log(`[DONE] ${message}`);
        },

        error: (message) => {
            console.log(message);
        }
    }
};