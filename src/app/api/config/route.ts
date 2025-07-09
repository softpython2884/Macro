import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';

// Force dynamic execution to ensure it always reads the file
// and doesn't get statically optimized.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await getConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('[API/CONFIG] Error getting config:', error);
    return NextResponse.json(
      { error: 'Could not load configuration.' },
      { status: 500 }
    );
  }
}
