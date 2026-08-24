import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusherServer';

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const socketId = data.get('socket_id') as string;
    const channelName = data.get('channel_name') as string;

    // Ideally, we extract the user ID from the session/cookies here.
    // For this prototype, since we are doing peer mentoring, we can just allow the connection
    // and use a dummy user_id or extract it from the channel name if needed.
    
    // For Presence channels (e.g. presence-room-123) we need presence data
    if (channelName.startsWith('presence-')) {
      const presenceData = {
        user_id: `user_${Date.now()}`,
        user_info: { name: 'User' },
      };
      
      const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData);
      return NextResponse.json(authResponse);
    } else {
      // For Private channels
      const authResponse = pusherServer.authorizeChannel(socketId, channelName);
      return NextResponse.json(authResponse);
    }
  } catch (error) {
    console.error('Pusher auth error:', error);
    return new NextResponse('Forbidden', { status: 403 });
  }
}
