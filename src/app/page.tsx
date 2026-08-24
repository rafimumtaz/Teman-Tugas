import App from '../App';
import { prisma } from '../lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// This turns the page into a dynamic server component if needed, 
// but since we are just doing an initial fetch, it can remain static/dynamic based on Next.js inference
export const revalidate = 0; // Force dynamic fetching so it updates

export default async function Page() {
  // Try to fetch from DB
  try {
    const dbUsers = await prisma.user.findMany({
      include: {
        badges: true,
        pastAssistanceAsStudent: true,
        pastAssistanceAsMentor: true,
        reviewsReceived: true,
        reviewsGiven: true,
      }
    });

    const dbQuestions = await prisma.question.findMany({
      include: {
        answers: true,
      }
    });

    // If the database actually has data, we can pass it down. 
    // For now, if we successfully fetch, we'll pass the dummy data structure to App 
    // to prevent breaking the Client Component which expects specific nested structures (like MentorProfile).
    // In a fully migrated app, we'd map the Prisma models back to the exact TypeScript interfaces expected by App.tsx.
    
    // Map Prisma `dbUsers` back to `UserProfile` / `MentorProfile` interfaces here if needed.
    // Convert all Date objects to string to prevent React child rendering errors.
    const serializeDates = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (obj instanceof Date) return obj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      if (Array.isArray(obj)) return obj.map(serializeDates);
      if (typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
          newObj[key] = serializeDates(obj[key]);
        }
        return newObj;
      }
      return obj;
    };

    const serializedUsers = serializeDates(dbUsers);
    const serializedQuestions = serializeDates(dbQuestions);

    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      redirect('/login');
    }

    const activeUser = dbUsers.find((u) => u.id === userId);
    if (!activeUser) {
      redirect('/login');
    }

    console.log(`Fetched ${dbUsers.length} users and ${dbQuestions.length} questions from Prisma!`);
    
    // We pass the data to App
    return <App dbUsers={serializedUsers} dbQuestions={serializedQuestions} initialUserId={userId} />;
  } catch (error) {
    console.error("Failed to fetch from Prisma, falling back to static data:", error);
    // If it's a redirect error, throw it so Next.js handles it
    if ((error as any).digest && (error as any).digest.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    // Otherwise return empty app or an error state
    return <div>Error loading database data. Please ensure the database is running.</div>;
  }
}
