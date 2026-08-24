'use server';

import { pusherServer } from '@/lib/pusherServer';
import { prisma as db } from '@/lib/prisma';

export async function requestLiveSession(mentorId: string, studentId: string, subject: string, questionId?: string, questionTitle?: string, studentProfile?: any) {
  try {
    // Prevent mentor requesting themselves
    if (mentorId === studentId) {
      throw new Error("Cannot request session with yourself");
    }

    // 1. Create a DB session
    const session = await db.liveSession.create({
      data: {
        mentorId,
        studentId,
        subject,
        questionId: questionId || null,
        status: 'pending',
      }
    });

    // 2. Notify the Mentor via Pusher
    // We send to `private-user-${mentorId}`
    await pusherServer.trigger(`private-user-${mentorId}`, 'incoming-session-request', {
      sessionId: session.id,
      studentId: studentId,
      student: studentProfile,
      subject,
      questionTitle: questionTitle || subject,
      timestamp: Date.now()
    });

    return { success: true, sessionId: session.id };
  } catch (error: any) {
    console.error("requestLiveSession error:", error);
    return { success: false, error: error.message };
  }
}

export async function acceptLiveSession(sessionId: string, mentorProfile: any, studentId: string) {
  try {
    // 1. Update DB
    await db.liveSession.update({
      where: { id: sessionId },
      data: { status: 'active' }
    });

    // 2. Notify Student via Pusher
    await pusherServer.trigger(`private-user-${studentId}`, 'session-accepted', {
      sessionId,
      mentor: mentorProfile
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectLiveSession(sessionId: string, studentId: string) {
  try {
    await db.liveSession.update({
      where: { id: sessionId },
      data: { status: 'rejected' }
    });

    await pusherServer.trigger(`private-user-${studentId}`, 'session-rejected', {
      sessionId
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
