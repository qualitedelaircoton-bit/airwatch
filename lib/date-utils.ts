import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Type definition for a Firestore Timestamp-like object
interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

// Type guard to check if a value is a FirestoreTimestamp-like object
function isFirestoreTimestamp(value: any): value is FirestoreTimestamp {
  return value && typeof value.seconds === 'number' && typeof value.nanoseconds === 'number';
}

/**
 * Formats a Firestore Timestamp or a compatible date representation into a readable string.
 * It safely handles null, undefined, ISO strings, and serialized Timestamp objects.
 *
 * @param timestamp - The timestamp to format. Can be a Firestore Timestamp object,
 *                    a string (like ISO 8601), a Date object, or null/undefined.
 * @param formatString - The desired output format string (defaults to a French locale format).
 * @returns A formatted date string or a fallback string if the input is invalid.
 */
export const formatFirestoreTimestamp = (
  timestamp: any,
  formatString = "dd/MM/yyyy HH:mm"
): string => {
  if (!timestamp) {
    return "Jamais vu";
  }

  // Case 1: The timestamp is a Firestore Timestamp object (e.g., from server-side rendering)
  if (isFirestoreTimestamp(timestamp)) {
    const date = new Date(timestamp.seconds * 1000);
    return format(date, formatString, { locale: fr });
  }

  // Case 2: The timestamp is already a JavaScript Date object
  if (timestamp instanceof Date) {
    return format(timestamp, formatString, { locale: fr });
  }

  // Case 3: The timestamp is a string (e.g., ISO 8601 from an API response)
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    // Check if the parsed date is valid
    if (!isNaN(date.getTime())) {
      return format(date, formatString, { locale: fr });
    }
  }

  // Fallback for unrecognized formats
  console.warn("Invalid or unrecognized date format:", timestamp);
  return "Date invalide";
};

/**
 * Safely parses a Firestore Timestamp or a compatible date representation into a Date object.
 *
 * @param timestamp - The timestamp to parse.
 * @returns A Date object or null if the input is invalid.
 */
export const parseFirestoreTimestamp = (timestamp: any): Date | null => {
  if (!timestamp) {
    return null;
  }

  if (isFirestoreTimestamp(timestamp)) {
    return new Date(timestamp.seconds * 1000);
  }

  if (timestamp instanceof Date) {
    return timestamp;
  }

  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
};
