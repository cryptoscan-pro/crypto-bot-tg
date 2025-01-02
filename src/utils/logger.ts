import winston from 'winston';
import { WinstonTransport as AxiomTransport } from '@axiomhq/winston';

const defaultMetadata = winston.format((info) => {
    info.service = 'crypto-bot-tg';
    return info;
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        defaultMetadata(),
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new AxiomTransport({
            dataset: process.env.AXIOM_DATASET!,
            token: process.env.AXIOM_TOKEN!,
          }),
        new winston.transports.Console({
            format: winston.format.simple(),
        })
    ]
});

if (process.env.AXIOM_TOKEN) {
    logger.add(new AxiomTransport({
        token: process.env.AXIOM_TOKEN!,
        dataset: process.env.AXIOM_DATASET!,
    }));
}

export { logger };
