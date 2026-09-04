import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

export async function deleteUserByEmail(email: string | null | undefined) {
  if (!email) {
    throw new Error('Email is required');
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in .env');
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();

    const db = client.db(
      process.env.MONGODB_DB_NAME || 'ics_hrms'
    );

    const users = db.collection('users');

    const result = await users.deleteOne({
      email: email,
    });

    if (result.deletedCount === 1) {
      console.log(`Deleted user record: ${email}`);
    } else {
      console.log(`No user record found: ${email}`);
    }
  } catch (error) {
    console.error(`Failed to delete user: ${email}`, error);
    throw error;
  } finally {
    await client.close();
  }
}

