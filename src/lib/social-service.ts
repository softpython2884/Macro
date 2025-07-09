
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

-- New required tables for achievements

CREATE TABLE `achievements` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `icon` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
);

INSERT INTO `achievements` (`id`, `name`, `description`, `icon`) VALUES
('PIONEER', 'Pioneer', 'Joined the Macro community.', 'Rocket'),
('COLLECTOR_1', 'Novice Collector', 'Have at least 5 games in your library.', 'Album'),
('COLLECTOR_2', 'Adept Collector', 'Have at least 10 games in your library.', 'Library'),
('SOCIALITE', 'Socialite', 'Created a local user profile for someone else.', 'Users');


CREATE TABLE `user_achievements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `achievement_id` varchar(255) NOT NULL,
  `unlocked_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_achievement_unique` (`user_id`,`achievement_id`),
  KEY `achievement_id` (`achievement_id`),
  CONSTRAINT `user_achievements_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `social_users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_achievements_ibfk_2` FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`id`) ON DELETE CASCADE
);
*/

type AuthResult = {
  success: boolean;
  message: string;
  user?: { id: number; username: string; email: string };
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide-react icon name
  unlocked_at: string;
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
       const userId = result.insertId;
       // Initialize activity for new user
      await connection.execute(
        'INSERT INTO social_activities (user_id, activity_status) VALUES (?, ?)',
        [userId, 'online']
      );
      // Grant "Pioneer" achievement
      await connection.execute(
        'INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
        [userId, 'PIONEER']
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

export type SocialProfile = {
    username: string;
    created_at: string;
    activity_status: string | null;
    activity_details: string | null;
    achievements: Achievement[];
};

export async function getSocialProfile(userId: number): Promise<SocialProfile | null> {
    if (!userId) return null;
    let connection;
    try {
        connection = await pool.getConnection();
        const [profileRows]: any = await connection.execute(`
            SELECT
                u.username,
                u.created_at,
                a.activity_status,
                a.activity_details
            FROM social_users u
            LEFT JOIN social_activities a ON u.id = a.user_id
            WHERE u.id = ?
        `, [userId]);
        
        if (profileRows.length === 0) return null;

        const [achievementRows]: any = await connection.execute(`
            SELECT
                a.id,
                a.name,
                a.description,
                a.icon,
                ua.unlocked_at
            FROM user_achievements ua
            JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = ?
            ORDER BY ua.unlocked_at DESC
        `, [userId]);

        return {
            ...profileRows[0],
            achievements: achievementRows,
        };

    } catch (error) {
        console.error(`[SOCIAL-DB] Error fetching profile for user ${userId}:`, error);
        return null;
    } finally {
        if (connection) connection.release();
    }
}

    