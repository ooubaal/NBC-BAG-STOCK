/**
 * Deeply sanitizes JavaScript objects/arrays before passing them to Firebase Firestore.
 * Prevents "FirebaseError: Unsupported field value: undefined" by converting undefined to null or stripping keys.
 */
export const sanitizeForFirestore = (val) => {
  if (val === undefined) return null;
  if (val === null) return null;
  if (typeof val !== 'object') return val;

  if (Array.isArray(val)) {
    return val.map(item => sanitizeForFirestore(item));
  }

  const result = {};
  for (const [key, value] of Object.entries(val)) {
    if (value !== undefined) {
      result[key] = sanitizeForFirestore(value);
    }
  }
  return result;
};
