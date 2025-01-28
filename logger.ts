import pino from "pino";

let destination: string = process.env.NODE_ENV === "production" ? "~/NewsBot/logs.txt" : "logs.txt";

const targets = [
    {
        target: "pino-pretty",
        options: {
            destination,
        }
    },
    {
        target: "pino-pretty",
    }
];


const logger = pino({
    transport: {
        targets,
    },

});

export default logger;