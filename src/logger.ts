import winston from 'winston';

const logFormat = winston.format(({ scope, ...info }) => {
  const message = `${new Date().toISOString()} [${scope || 'System'}] - ${
    info.message
  }`;

  return { ...info, message };
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(logFormat(), winston.format.simple()),
  transports: [new winston.transports.Console()],
});

export default logger;
