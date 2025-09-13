import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAdminAuth } from '@/lib/api-auth';


export const dynamic = "force-dynamic"

async function postHandler(request: NextRequest) {
  if (!adminDb) {
    return new NextResponse(
      JSON.stringify({ error: 'Firebase Admin SDK is not initialized.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
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

    sensorIds.forEach((id: unknown) => {
      if (typeof id !== 'string' || id.trim() === '') {
        throw new Error(`Invalid sensor ID found in the list: ${String(id)}`);
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

export const POST = withAdminAuth(postHandler)
