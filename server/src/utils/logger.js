const ts = () => new Date().toISOString();

const write = (level, args) => {
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](`[${ts()}] [${level.toUpperCase()}]`, ...args);
};

export const logger = {
  info: (...args) => write('info', args),
  warn: (...args) => write('warn', args),
  error: (...args) => write('error', args),
  debug: (...args) => write('debug', args),
};

export default logger;
