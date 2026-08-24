import { prisma } from '../src/lib/prisma';
import { MOCK_ALL_USERS, INITIAL_QUESTIONS } from '../src/data/mockData';

async function main() {
  console.log('Starting seed...');

  // 1. Seed Users
  for (const mockUser of MOCK_ALL_USERS) {
    const existing = await prisma.user.findUnique({
      where: { username: mockUser.username },
    });

    if (!existing) {
      const dbUser = await prisma.user.create({
        data: {
          id: mockUser.id,
          username: mockUser.username || `user_${mockUser.id}`,
          email: `${mockUser.username || mockUser.id}@example.com`,
          passwordHash: 'dummy_hash', // In a real app, hash a default password
          name: mockUser.name,
          avatar: mockUser.avatar,
          role: mockUser.role,
          academicLevel: mockUser.academicLevel,
          universityOrSchool: mockUser.universityOrSchool,
          bio: mockUser.bio,
          level: mockUser.level,
          xp: mockUser.xp,
          xpToNextLevel: mockUser.xpToNextLevel,
          temanCoins: mockUser.temanCoins,
          honorScore: mockUser.honorScore,
          reputationPoints: mockUser.reputationPoints,
          reputationTier: mockUser.reputationTier,
          rating: mockUser.rating,
          reviewsCount: mockUser.reviewsCount,
          streakDays: mockUser.streakDays,
          activeRole: mockUser.activeRole,
          hourlyCoins: mockUser.hourlyCoins,
          isOnline: mockUser.isOnline,
          totalHelpSessions: mockUser.totalHelpSessions,
          totalQuestionsSolved: mockUser.totalQuestionsSolved,
          successRate: mockUser.successRate,
          expertSubjects: mockUser.expertSubjects,
          
          badges: {
            create: mockUser.badges?.map(b => ({
              id: b.id,
              name: b.name,
              description: b.description,
              icon: b.icon,
              category: b.category,
              tier: b.tier,
              unlocked: b.unlocked,
              progress: b.progress,
              maxProgress: b.maxProgress,
            })) || []
          }
        },
      });
      console.log(`Created user: ${dbUser.name}`);
    }
  }

  // 2. Seed Questions (and missing askers)
  for (const q of INITIAL_QUESTIONS) {
    // Ensure asker exists
    const asker = await prisma.user.findUnique({ where: { id: q.askerId } });
    if (!asker) {
      await prisma.user.create({
        data: {
          id: q.askerId,
          username: `asker_${q.askerId}`,
          email: `${q.askerId}@example.com`,
          passwordHash: 'dummy',
          name: q.askerName,
          avatar: q.askerAvatar,
          universityOrSchool: q.askerSchool,
          level: q.askerLevel,
          role: 'student'
        }
      });
      console.log(`Created dummy asker user: ${q.askerName}`);
    }

    const existingQ = await prisma.question.findUnique({
      where: { id: q.id },
    });

    if (!existingQ) {
      const dbQ = await prisma.question.create({
        data: {
          id: q.id,
          title: q.title,
          description: q.description,
          rawEquation: q.rawEquation,
          subject: q.subject,
          subTopic: q.subTopic,
          difficulty: q.difficulty,
          tags: q.tags,
          bountyCoins: q.bountyCoins,
          bountyXp: q.bountyXp,
          status: q.status,
          answersCount: q.answersCount,
          upvotes: q.upvotes,
          views: q.views,
          askerId: q.askerId, // Assuming askerId matches a User ID from MOCK_ALL_USERS (like usr_s1, usr_s2, etc. Wait, are usr_s1 created? MOCK_ALL_USERS doesn't have usr_s1!)
        }
      });
      console.log(`Created question: ${dbQ.title}`);
    }
  }

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
