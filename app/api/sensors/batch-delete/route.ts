import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb, adminAuth } from '@/lib/firebase-admin';


export const dynamic = "force-static"

export async function POST(request: Request) {
  if (!adminDb || !adminAuth) {
    return new NextResponse(
      JSON.stringify({ error: 'Firebase Admin SDK is not initialized.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const token = (await cookies()).get('firebaseIdToken')?.value;

  if (!token) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized: No token provided.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (decodedToken.role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Forbidden: Insufficient permissions.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    return new NextResponse(JSON.stringify({ error: 'Unauthorized: Invalid token.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { sensorIds } = await request.json();

    if (!Array.isArray(sensorIds) || sensorIds.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Bad Request: sensorIds must be a non-empty array.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const batch = adminDb.batch();
    const sensorsCollection = adminDb.collection('sensors');

    sensorIds.forEach(id => {
      if (typeof id !== 'string' || id.trim() === '') {
        // En production, on pourrait juste ignorer les IDs invalides ou rejeter toute la requête.
        // Ici, nous allons rejeter pour plus de sécurité.
        throw new Error(`Invalid sensor ID found in the list: ${id}`);
      }
      const sensorRef = sensorsCollection.doc(id);
      batch.delete(sensorRef);
    });

    await batch.commit();

    return new NextResponse(JSON.stringify({ message: `${sensorIds.length} sensor(s) deleted successfully.` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error during batch deletion:', error);
    if (error instanceof Error && error.message.includes('Invalid sensor ID')) {
        return new NextResponse(JSON.stringify({ error: `Bad Request: ${error.message}` }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
