import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
    ),
    transports: [
        // This line ensures the file is created in the /logs folder
        new winston.transports.File({ filename: 'logs/system_operations.log' }),
        new winston.transports.Console()
    ],
});

export default logger;