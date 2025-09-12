import { NextResponse } from 'next/server';
import { DateTimeManager } from '@/utils/datetime';

export async function GET() {
  try {
    const peruTime = DateTimeManager.nowPeru();
    
    return NextResponse.json({
      success: true,
      timestamp: peruTime.toISOString(),
      formatted: DateTimeManager.formatForDisplay(peruTime),
      timezone: 'America/Lima'
    });
  } catch (error) {
    console.error('Error getting Peru time:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error getting Peru time',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}