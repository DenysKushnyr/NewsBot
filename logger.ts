import pino from "pino";

const DESTINATION = "LOGS.txt";
let targets;

if (process.env.NODE_ENV === "production") {
    targets = [
        {
            target: "pino-pretty",
            options: {
                destination: DESTINATION,
            }
        },
    ]
} else {
    targets = [
        {
            target: "pino-pretty",
            options: {
                destination: DESTINATION,
            }
        },
        {
            target: "pino-pretty",
        }
    ]
}


const logger = pino({
    transport: {
        targets,
    },

});

export default logger;