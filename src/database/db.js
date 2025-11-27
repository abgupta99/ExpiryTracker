import { initDB } from './schema';
import { updateExpired, addItem, getExpiringItems } from './queries';

export const setupDatabase = () => {
  initDB();
  updateExpired();
};

export { addItem, getExpiringItems, updateExpired };

export default null;
