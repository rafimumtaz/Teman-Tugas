'use server';

import { prisma } from '../../lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function submitMentorReview(mentorId: string, reviewData: {
  rating: number;
  comment: string;
  pointsAwarded: number;
  sessionType: string;
}) {
  const cookieStore = await cookies();
  const reviewerId = cookieStore.get('userId')?.value;

  if (!reviewerId) {
    return { error: 'You must be logged in to submit a review.' };
  }

  try {
    const reviewer = await prisma.user.findUnique({ where: { id: reviewerId } });
    const mentor = await prisma.user.findUnique({ where: { id: mentorId } });

    if (!reviewer || !mentor) {
      return { error: 'User not found.' };
    }

    // Create Review
    const review = await prisma.mentorReview.create({
      data: {
        mentorId,
        reviewerId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        pointsAwarded: reviewData.pointsAwarded,
        sessionType: reviewData.sessionType,
        tags: ['Live Whiteboard'],
      }
    });

    // Calculate new mentor stats
    const newCount = mentor.reviewsCount + 1;
    const currentTotalRating = mentor.rating * mentor.reviewsCount;
    const newRating = (currentTotalRating + reviewData.rating) / newCount;
    
    const newReputation = mentor.reputationPoints + reviewData.pointsAwarded;
    let newTier = 'Novice Mentor';
    if (newReputation >= 4500) newTier = 'Master Mentor';
    else if (newReputation >= 2000) newTier = 'Elite Scholar';
    else if (newReputation >= 500) newTier = 'Trusted Peer';

    // Update Mentor
    await prisma.user.update({
      where: { id: mentorId },
      data: {
        reviewsCount: newCount,
        rating: newRating,
        reputationPoints: newReputation,
        reputationTier: newTier,
        totalHelpSessions: mentor.totalHelpSessions + 1,
      }
    });

    // Award Reviewer (Student) XP and coins for completing the session
    await prisma.user.update({
      where: { id: reviewerId },
      data: {
        xp: { increment: 150 },
        temanCoins: { increment: 25 }, // Completion bonus
        totalHelpSessions: { increment: 1 },
      }
    });

    // Record Past Assistance for both
    await prisma.pastAssistance.create({
      data: {
        title: `Bimbingan "${reviewData.sessionType}"`,
        subject: mentor.expertSubjects[0] || 'Akademik',
        type: reviewData.sessionType.includes('Live') ? 'live_session' : 'qna_solution',
        studentId: reviewerId,
        mentorId: mentorId,
        rating: reviewData.rating,
        pointsEarned: reviewData.pointsAwarded,
        coinsEarned: mentor.hourlyCoins,
        reviewSnippet: reviewData.comment,
        isAccepted: true,
      }
    });

    revalidatePath('/');
    return { success: true, review };
  } catch (error) {
    console.error('Failed to submit review:', error);
    return { error: 'Failed to submit review.' };
  }
}
