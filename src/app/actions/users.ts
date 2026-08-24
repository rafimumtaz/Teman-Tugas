'use server';

import { prisma } from '../../lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function updateProfile(data: {
  name?: string;
  username?: string;
  universityOrSchool?: string;
  academicLevel?: string;
  bio?: string;
  expertSubjects?: string[];
  hourlyCoins?: number;
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) return { error: 'Not logged in.' };

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });
    revalidatePath('/');
    return { success: true, user };
  } catch (error) {
    console.error('Update profile error:', error);
    return { error: 'Gagal memperbarui profil.' };
  }
}

export async function onboardMentor(data: {
  universityOrSchool: string;
  academicLevel: string;
  expertSubjects: string[];
  bio: string;
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) return { error: 'Not logged in.' };

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: 'User not found' };

    // Update user to mentor role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'mentor',
        activeRole: 'mentor',
        universityOrSchool: data.universityOrSchool,
        academicLevel: data.academicLevel,
        expertSubjects: data.expertSubjects,
        bio: data.bio,
        reputationPoints: Math.max(user.reputationPoints, 500),
        reputationTier: 'Trusted Peer',
        hourlyCoins: 40,
      }
    });
    revalidatePath('/');
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Onboard mentor error:', error);
    return { error: 'Gagal mendaftar sebagai mentor.' };
  }
}

export async function claimReward(cost: number) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) return { error: 'Not logged in.' };

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: 'User not found' };

    if (user.temanCoins < cost) {
      return { error: 'Saldo TemanCoins tidak cukup.' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        temanCoins: { decrement: cost },
        honorScore: { increment: 100 },
      }
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Claim reward error:', error);
    return { error: 'Gagal menukar reward.' };
  }
}
