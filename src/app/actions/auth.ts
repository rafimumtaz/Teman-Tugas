'use server';

import { prisma } from '../../lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function registerUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
    return { error: 'All fields are required.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' };
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: 'An account with this email already exists.' };
    }

    // Generate a simple username from email
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

    // Create the user in the database
    // Note: In a real production app, ALWAYS hash the password using bcrypt/argon2
    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        passwordHash: password, // Store plain text for prototype demo purposes
        role: 'student',
        activeRole: 'student',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      },
    });

    // Set a simple session cookie
    const cookieStore = await cookies();
    cookieStore.set('userId', user.id, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return { success: true, message: 'Account created successfully!' };
  } catch (err: any) {
    console.error('Registration error:', err);
    return { error: 'Failed to create account. Please try again.' };
  }
}

export async function loginUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: 'Invalid email or password.' };
    }

    // Since we're storing plaintext passwords for prototyping:
    if (user.passwordHash !== password) {
      return { error: 'Invalid email or password.' };
    }

    // Set a simple session cookie
    const cookieStore = await cookies();
    cookieStore.set('userId', user.id, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    
    return { success: true, message: 'Signed in successfully!' };
  } catch (err: any) {
    console.error('Login error:', err);
    return { error: 'Failed to log in. Please try again later.' };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
  return { success: true };
}
