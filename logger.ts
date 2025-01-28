import pino from "pino";

let targets;

if (process.env.NODE_ENV === "production") {
    targets = [
        {
            target: "pino-pretty",
            options: {
                destination: "~/NewsBot/logs.txt",
            }
        },
    ]
} else {
    targets = [
        {
            target: "pino-pretty",
            options: {
                destination: "logs.txt",
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