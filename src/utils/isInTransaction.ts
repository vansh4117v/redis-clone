import { memoryStore } from "../store/memoryStore.js";

export const isInTransaction = (socketId: string): boolean => {
  const transaction = memoryStore.getTransaction(socketId);
  return transaction !== undefined && transaction.inMulti;
};
