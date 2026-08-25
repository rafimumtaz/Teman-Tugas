import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusherServer';

export async function POST(req: NextRequest) {
  try {
    const { channel, event, data, socket_id } = await req.json();

    if (!channel || !event || !data) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Trigger the event via Pusher server SDK.
    // By passing socket_id, Pusher will not send the event back to the sender's client.
    if (socket_id) {
      await pusherServer.trigger(channel, event, data, { socket_id });
    } else {
      await pusherServer.trigger(channel, event, data);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pusher trigger error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
