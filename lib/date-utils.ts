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

// Support Firestore export shapes like {_seconds,_nanoseconds}
function isFirestoreUnderscoreTimestamp(value: any): value is { _seconds: number; _nanoseconds: number } {
  return value && typeof value._seconds === 'number' && typeof value._nanoseconds === 'number';
}

// Normalize various timestamp inputs to a JS Date, or null if not parseable
function normalizeToDate(input: any): Date | null {
  if (!input) return null;

  // Firestore Timestamp (Admin/Client) instance: has toDate()
  if (typeof input?.toDate === 'function') {
    try {
      return input.toDate();
    } catch {}
  }

  // Firestore object shape {seconds, nanoseconds}
  if (isFirestoreTimestamp(input)) {
    return new Date(input.seconds * 1000);
  }

  // Handle timestamp objects where seconds/_seconds are stringified numbers
  if (input && typeof input === 'object') {
    const sec = typeof (input as any).seconds === 'string' ? parseInt((input as any).seconds, 10) : undefined;
    const usec = typeof (input as any)._seconds === 'string' ? parseInt((input as any)._seconds, 10) : undefined;
    if (Number.isFinite(sec)) {
      const d = new Date(sec! * 1000);
      if (!isNaN(d.getTime())) return d;
    }
    if (Number.isFinite(usec)) {
      const d = new Date(usec! * 1000);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Firestore export shape {_seconds,_nanoseconds}
  if (isFirestoreUnderscoreTimestamp(input)) {
    return new Date(input._seconds * 1000);
  }

  // Numeric epoch (ms or seconds)
  if (typeof input === 'number' && isFinite(input)) {
    const ms = input < 1e11 ? input * 1000 : input; // treat < ~year 5138s threshold as seconds
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  // ISO string or date-like string
  if (typeof input === 'string') {
    // Numeric-like string (epoch seconds or ms)
    if (/^\d+$/.test(input)) {
      const num = parseInt(input, 10);
      if (Number.isFinite(num)) {
        const ms = num < 1e11 ? num * 1000 : num;
        const d = new Date(ms);
        return isNaN(d.getTime()) ? null : d;
      }
    }
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
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

  const date = normalizeToDate(timestamp);
  if (date) return format(date, formatString, { locale: fr });

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
  return normalizeToDate(timestamp);
};
