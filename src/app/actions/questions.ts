'use server';

import { prisma } from '../../lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function createQuestion(data: {
  title: string;
  description: string;
  rawEquation?: string;
  subject: string;
  subTopic: string;
  difficulty: string;
  tags: string[];
  bountyCoins: number;
  bountyXp: number;
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return { error: 'You must be logged in to ask a question.' };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { error: 'User not found.' };
    }

    if (user.temanCoins < data.bountyCoins) {
      return { error: 'Saldo TemanCoins tidak cukup.' };
    }

    // Deduct coins from user
    await prisma.user.update({
      where: { id: userId },
      data: {
        temanCoins: user.temanCoins - data.bountyCoins,
        xp: user.xp + 20, // Give some XP for asking
      },
    });

    const question = await prisma.question.create({
      data: {
        title: data.title,
        description: data.description,
        rawEquation: data.rawEquation,
        subject: data.subject,
        subTopic: data.subTopic,
        difficulty: data.difficulty,
        tags: data.tags,
        bountyCoins: data.bountyCoins,
        bountyXp: data.bountyXp,
        askerId: userId,
      },
      include: {
        answers: true,
      }
    });

    revalidatePath('/');
    return { success: true, question };
  } catch (error) {
    console.error('Failed to create question:', error);
    return { error: 'Failed to create question in database.' };
  }
}

export async function createAnswer(qId: string, data: { content: string; stepByStep?: string[] }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) return { error: 'Not logged in.' };

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: 'User not found.' };

    const answer = await prisma.questionAnswer.create({
      data: {
        questionId: qId,
        authorId: userId,
        content: data.content,
        stepByStep: data.stepByStep || [],
        isVerifiedByMentor: user.role === 'mentor' || user.activeRole === 'mentor',
      }
    });

    // Update question answers count
    await prisma.question.update({
      where: { id: qId },
      data: { answersCount: { increment: 1 } }
    });

    // Award helper XP, reputation points & honor
    const addedPoints = 60;
    const newReputation = user.reputationPoints + addedPoints;
    
    // Simple tier calc
    let newTier = 'Novice Mentor';
    if (newReputation >= 4500) newTier = 'Master Mentor';
    else if (newReputation >= 2000) newTier = 'Elite Scholar';
    else if (newReputation >= 500) newTier = 'Trusted Peer';

    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: 80 },
        honorScore: { increment: 25 },
        reputationPoints: newReputation,
        reputationTier: newTier,
        totalQuestionsSolved: { increment: 1 },
      }
    });

    // Create PastAssistance
    const question = await prisma.question.findUnique({ where: { id: qId } });
    if (question) {
      await prisma.pastAssistance.create({
        data: {
          title: question.title,
          subject: question.subject,
          type: 'qna_solution',
          studentId: question.askerId,
          mentorId: userId,
          rating: 5, // Auto-rating for answering
          pointsEarned: 60,
          coinsEarned: question.bountyCoins,
          reviewSnippet: 'Penjelasan langkah terstruktur dengan sangat baik!',
        }
      });
    }

    revalidatePath('/');
    return { success: true, answer };
  } catch (err) {
    console.error('Answer err:', err);
    return { error: 'Gagal menambahkan jawaban.' };
  }
}

export async function acceptAnswer(qId: string, ansId: string, bounty: number) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) return { error: 'Not logged in.' };

  try {
    const question = await prisma.question.findUnique({ where: { id: qId } });
    if (question?.askerId !== userId) return { error: 'Hanya pembuat soal yang bisa menerima jawaban.' };

    const answer = await prisma.questionAnswer.findUnique({ where: { id: ansId } });
    if (!answer) return { error: 'Jawaban tidak ditemukan.' };

    // Mark as accepted
    await prisma.questionAnswer.update({
      where: { id: ansId },
      data: { isAccepted: true }
    });

    // Close question
    await prisma.question.update({
      where: { id: qId },
      data: { status: 'resolved' }
    });

    // Transfer bounty to answer author
    await prisma.user.update({
      where: { id: answer.authorId },
      data: { temanCoins: { increment: bounty } }
    });

    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('Accept err:', err);
    return { error: 'Gagal menerima jawaban.' };
  }
}

export async function upvoteQuestion(qId: string) {
  try {
    await prisma.question.update({
      where: { id: qId },
      data: { upvotes: { increment: 1 } }
    });
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    return { error: 'Gagal upvote.' };
  }
}
