
'use server';

import pool from './db';
import type { PoolConnection } from 'mysql2/promise';

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

CREATE TABLE `achievements` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `icon` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
);

-- Initial achievements to insert into the `achievements` table.
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

// Internal helper function to grant an achievement. Not exported.
async function grantAchievement(userId: number, achievementId: string, connection: PoolConnection): Promise<boolean> {
    const [result]: any = await connection.execute(
        'INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
        [userId, achievementId]
    );
    return result.affectedRows > 0;
}


export async function registerUser({ username, email, password }: Record<string, string>): Promise<AuthResult> {
  if (!username || !email || !password) {
    return { success: false, message: 'All fields are required.' };
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existingUsers]: any = await connection.execute(
      'SELECT id FROM social_users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existingUsers.length > 0) {
      await connection.rollback();
      return { success: false, message: 'Username or email already exists.' };
    }

    const [result]: any = await connection.execute(
      'INSERT INTO social_users (username, email, password) VALUES (?, ?, ?)',
      [username, email, password]
    );

    if (result.insertId) {
       const userId = result.insertId;
       await connection.execute(
        'INSERT INTO social_activities (user_id, activity_status) VALUES (?, ?)',
        [userId, 'online']
      );
      await grantAchievement(userId, 'PIONEER', connection);
      await connection.commit();
      return { success: true, message: 'Registration successful!' };
    } else {
      await connection.rollback();
      return { success: false, message: 'Failed to create user.' };
    }

  } catch (error: any) {
    if (connection) await connection.rollback();
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
      'INSERT INTO social_activities (user_id, activity_status, activity_details) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE activity_status = VALUES(activity_status), activity_details = VALUES(activity_details)',
      [userId, status, details]
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
      JOIN social_activities a ON u.id = a.user_id
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


export async function checkAndAwardAchievements(userId: number, criteria: { gameCount?: number; profileCount?: number }): Promise<string[]> {
    if (!userId) return [];

    let connection;
    const newlyAwarded: string[] = [];

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [existingAchievements]: any = await connection.execute(
            'SELECT achievement_id FROM user_achievements WHERE user_id = ?',
            [userId]
        );
        const existingIds = new Set(existingAchievements.map((a: any) => a.achievement_id));

        // Collector Achievements
        if (criteria.gameCount !== undefined) {
            if (criteria.gameCount >= 10 && !existingIds.has('COLLECTOR_2')) {
                if (await grantAchievement(userId, 'COLLECTOR_2', connection)) {
                    newlyAwarded.push('Adept Collector');
                }
            }
            if (criteria.gameCount >= 5 && !existingIds.has('COLLECTOR_1')) {
                if (await grantAchievement(userId, 'COLLECTOR_1', connection)) {
                    newlyAwarded.push('Novice Collector');
                }
            }
        }

        // Socialite Achievement
        if (criteria.profileCount !== undefined) {
            // The creator has their own profile, so we check for more than 1.
            if (criteria.profileCount > 1 && !existingIds.has('SOCIALITE')) {
                 if (await grantAchievement(userId, 'SOCIALITE', connection)) {
                    newlyAwarded.push('Socialite');
                }
            }
        }
        
        await connection.commit();
        return newlyAwarded;

    } catch (error: any) {
        console.error(`[SOCIAL-DB] Error checking achievements for user ${userId}:`, error);
        if (connection) await connection.rollback();
        return [];
    } finally {
        if (connection) connection.release();
    }
}
    
