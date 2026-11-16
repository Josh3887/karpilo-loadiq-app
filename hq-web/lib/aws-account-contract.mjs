export const ACCOUNT_INDEX_NAMES = Object.freeze(['subscribers','subscriptions','vehicles','expenses','profit_profiles','saved_loads']);
export const MAX_PAGE_SIZE = 100;
export function validateIndex(index) { return ACCOUNT_INDEX_NAMES.includes(index); }
export function validateCursor(cursor) { return cursor === null || (typeof cursor === 'string' && cursor.length > 0 && cursor.length <= 512 && !/[\r\n]/.test(cursor)); }
export function validateGatewayPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  if (!Array.isArray(payload.records) || payload.records.length > MAX_PAGE_SIZE) return false;
  if (payload.nextCursor !== null && payload.nextCursor !== undefined && !validateCursor(payload.nextCursor)) return false;
  return payload.records.every(record => record && typeof record === 'object' && !Array.isArray(record));
}
