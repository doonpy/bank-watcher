import logger from './logger.ts';
import { Techcombank } from './techcombank.ts';

(async () => {
  try {
    const techcombank = await Techcombank.getInstance();
    await techcombank.start();
  } catch (error) {
    logger.error(error);
  }
})();
