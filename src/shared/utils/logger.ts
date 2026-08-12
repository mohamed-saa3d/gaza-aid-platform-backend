const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  info: (...args: unknown[]) => {
    if (isDevelopment) console.info(...args);
    else console.log(...args);
  },
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
  debug: (...args: unknown[]) => {
    if (isDevelopment) console.debug(...args);
  },
};

export default logger;
