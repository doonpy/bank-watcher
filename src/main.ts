import logger from './logger.ts';
import { Techcombank } from './techcombank.ts';

(async () => {
  try {
    const techcombank = await Techcombank.getInstance();
    await techcombank.start();
    await techcombank.close();
  } catch (error) {
    logger.error(error);
  }
})();
