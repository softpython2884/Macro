'use server';

import pool from './db';
// NOTE: For a real production app, passwords MUST be hashed using a library like bcrypt.
// This implementation stores plaintext passwords for prototype simplicity.

// Assumed DB schema:
/*
CREATE TABLE `social_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
);

CREATE TABLE `social_activities` (
  `user_id` int(11) NOT NULL,
  `activity_status` varchar(255) DEFAULT NULL,
  `activity_details` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `social_activities_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `social_users` (`id`) ON DELETE CASCADE
);
*/

type AuthResult = {
  success: boolean;
  message: string;
  user?: { id: number; username: string; email: string };
};

export async function registerUser({ username, email, password }: Record<string, string>): Promise<AuthResult> {
  if (!username || !email || !password) {
    return { success: false, message: 'All fields are required.' };
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Check if username or email already exists
    const [existingUsers]: any = await connection.execute(
      'SELECT id FROM social_users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existingUsers.length > 0) {
      return { success: false, message: 'Username or email already exists.' };
    }

    // Insert new user
    const [result]: any = await connection.execute(
      'INSERT INTO social_users (username, email, password) VALUES (?, ?, ?)',
      [username, email, password] // Storing plaintext password
    );

    if (result.insertId) {
       // Initialize activity for new user
      await connection.execute(
        'INSERT INTO social_activities (user_id, activity_status) VALUES (?, ?)',
        [result.insertId, 'online']
      );
      return { success: true, message: 'Registration successful!' };
    } else {
      return { success: false, message: 'Failed to create user.' };
    }

  } catch (error: any) {
    console.error('[SOCIAL-DB] Registration Error:', error);
    return { success: false, message: 'A database error occurred.' };
  } finally {
    if (connection) connection.release();
  }
}

export async function loginUser({ email, password }: Record<string, string>): Promise<AuthResult> {
    if (!email || !password) {
        return { success: false, message: 'Email and password are required.' };
    }
    
    let connection;
    try {
        connection = await pool.getConnection();

        const [rows]: any = await connection.execute(
            'SELECT id, username, email, password FROM social_users WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return { success: false, message: 'Invalid email or password.' };
        }

        const user = rows[0];
        // Plaintext password comparison
        if (user.password !== password) {
            return { success: false, message: 'Invalid email or password.' };
        }
        
        await connection.execute(
            'UPDATE social_activities SET activity_status = ?, activity_details = NULL WHERE user_id = ?',
            ['online', user.id]
        );

        return {
            success: true,
            message: `Welcome back, ${user.username}!`,
            user: { id: user.id, username: user.username, email: user.email },
        };
    } catch (error: any) {
        console.error('[SOCIAL-DB] Login Error:', error);
        return { success: false, message: 'A database error occurred.' };
    } finally {
        if (connection) connection.release();
    }
}

export async function updateUserActivity(userId: number, status: string | null, details: string | null): Promise<{ success: boolean }> {
  if (!userId) {
    return { success: false };
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.execute(
      'UPDATE social_activities SET activity_status = ?, activity_details = ? WHERE user_id = ?',
      [status, details, userId]
    );
    return { success: true };
  } catch (error) {
    console.error(`[SOCIAL-DB] Error updating activity for user ${userId}:`, error);
    return { success: false };
  } finally {
    if (connection) connection.release();
  }
}

export type SocialActivity = {
  user_id: number;
  username: string;
  activity_status: string | null;
  activity_details: string | null;
  updated_at: string;
};

export async function getSocialActivities(): Promise<SocialActivity[]> {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows]: any = await connection.execute(`
      SELECT
        u.id AS user_id,
        u.username,
        a.activity_status,
        a.activity_details,
        a.updated_at
      FROM social_users u
      LEFT JOIN social_activities a ON u.id = a.user_id
      ORDER BY a.updated_at DESC
    `);
    return rows;
  } catch (error) {
    console.error('[SOCIAL-DB] Error fetching activities:', error);
    return [];
  } finally {
    if (connection) connection.release();
  }
}