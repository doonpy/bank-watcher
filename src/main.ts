import logger from './logger.ts';
import { Techcombank } from './techcombank.ts';

(async () => {
  const techcombank = await Techcombank.getInstance();
  try {
    await techcombank.start();
  } catch (error) {
    logger.error(error);
    await techcombank.restart();
  }
})();
