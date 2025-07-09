
'use server';

import pool from './db';
import type { PoolConnection } from 'mysql2/promise';

// NOTE: For a real production app, passwords MUST be hashed using a library like bcrypt.
// This implementation stores plaintext passwords for prototype simplicity.

let isDbInitialized = false;

async function initializeDatabase() {
    if (isDbInitialized) return;

    let connection;
    try {
        console.log('[SOCIAL-DB] Initializing database schema...');
        connection = await pool.getConnection();

        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`social_users\` (
              \`id\` int(11) NOT NULL AUTO_INCREMENT,
              \`username\` varchar(255) NOT NULL,
              \`email\` varchar(255) NOT NULL,
              \`password\` varchar(255) NOT NULL,
              \`avatar_url\` TEXT DEFAULT NULL,
              \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`username\` (\`username\`),
              UNIQUE KEY \`email\` (\`email\`)
            );
        `);
        
        // --- Migration: Add avatar_url if it doesn't exist ---
        try {
            await connection.query('ALTER TABLE `social_users` ADD COLUMN `avatar_url` TEXT DEFAULT NULL');
            console.log('[SOCIAL-DB] Migration: Added `avatar_url` column to `social_users`.');
        } catch (error: any) {
            // ER_DUP_FIELDNAME is the error code for when the column already exists.
            if (error.code !== 'ER_DUP_FIELDNAME') {
                throw error; // Re-throw unexpected errors
            }
            // If the column already exists, we can safely ignore the error.
        }
        // --- End Migration ---


        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`social_activities\` (
              \`user_id\` int(11) NOT NULL,
              \`activity_status\` varchar(255) DEFAULT NULL,
              \`activity_details\` varchar(255) DEFAULT NULL,
              \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              PRIMARY KEY (\`user_id\`),
              CONSTRAINT \`social_activities_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`social_users\` (\`id\`) ON DELETE CASCADE
            );
        `);
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`achievements\` (
              \`id\` varchar(255) NOT NULL,
              \`name\` varchar(255) NOT NULL,
              \`description\` text NOT NULL,
              \`icon\` varchar(255) NOT NULL,
              PRIMARY KEY (\`id\`)
            );
        `);

        await connection.query(`
            INSERT IGNORE INTO \`achievements\` (\`id\`, \`name\`, \`description\`, \`icon\`) VALUES
            ('PIONEER', 'Pioneer', 'Joined the Macro community.', 'Rocket'),
            ('SOCIALITE', 'Socialite', 'Created a local user profile for someone else.', 'Users'),
            ('FIRST_CONTACT', 'First Contact', 'Add your first friend.', 'UserPlus'),
            ('NETWORKER', 'Networker', 'Build a network of 5 friends.', 'Users'),
            ('NETWORKER_2', 'Community Pillar', 'Build a network of 10 friends.', 'Network'),
            ('NETWORKER_3', 'Party Starter', 'Build a network of 25 friends.', 'PartyPopper'),
            
            ('COLLECTOR_1', 'Novice Collector', 'Have at least 5 games in your library.', 'Album'),
            ('COLLECTOR_2', 'Adept Collector', 'Have at least 10 games in your library.', 'Library'),
            ('COLLECTOR_3', 'Collector III', 'Have at least 25 games in your library.', 'Gem'),
            ('COLLECTOR_4', 'Collector IV', 'Have at least 50 games in your library.', 'Crown'),
            ('LIBRARIAN', 'Librarian', 'Have at least 100 games in your library.', 'BookOpen'),

            ('APP_CONNOISSEUR', 'App Connoisseur', 'Launch 5 different applications.', 'LayoutGrid'),
            ('APP_JUGGLER', 'App Juggler', 'Launch 10 different applications.', 'Layers'),
            ('WEB_SURFER', 'Web Surfer', 'Launch 5 different web apps.', 'Globe'),
            ('STREAMER_PAL', 'Streamer''s Pal', 'Launch Moonlight for the first time.', 'Moon'),
            ('COMMANDER', 'Commander', 'Put the computer to sleep using Macro.', 'Bed'),

            ('PLAYTIME_1', 'Apprentice Gamer', 'Accumulate 1 hour of total playtime across all games.', 'Hourglass'),
            ('PLAYTIME_2', 'Dedicated Gamer', 'Accumulate 10 hours of total playtime across all games.', 'Clock'),
            ('PLAYTIME_3', 'Hardcore Gamer', 'Accumulate 50 hours of total playtime across all games.', 'Timer'),
            ('PLAYTIME_4', 'Master Gamer', 'Accumulate 100 hours of total playtime.', 'Gamepad'),
            ('PLAYTIME_5', 'Gaming Legend', 'Accumulate 250 hours of total playtime.', 'Star'),

            ('SESSION_1', 'Focused Player', 'Complete a single play session of at least 2 hours.', 'Gamepad2'),
            ('SESSION_2', 'Marathon Runner', 'Complete a single play session of at least 4 hours.', 'Trophy'),

            ('APP_STORE_EXPLORER', 'App Store Explorer', 'Viewed 10 different items in the App Store.', 'Download'),
            ('WINDOW_SHOPPER', 'Window Shopper', 'View 25 different items in the App Store.', 'ShoppingCart'),
            ('SUPER_SHOPPER', 'Super Shopper', 'View 50 different items in the App Store.', 'ShoppingBag'),
            ('THE_CURATOR', 'The Curator', 'Install a game using the Direct Install feature.', 'PackageCheck'),
            ('DOWNLOAD_MANAGER', 'Download Manager', 'Install 5 games using the Direct Install feature.', 'PackagePlus'),

            ('TINKERER', 'Tinkerer', 'Save the settings for the first time.', 'Cog'),
            ('SECURITY_CONSCIOUS', 'Security Conscious', 'Create a new profile that is protected by a PIN.', 'Shield'),
            ('IDENTITY_CHANGE', 'New Look', 'Change your social profile avatar.', 'UserCog'),
            ('PHOTOGRAPHER', 'Photographer', 'Set a custom banner image for a game.', 'Image'),
            ('ART_DIRECTOR', 'Art Director', 'Set custom banner images for 5 different games.', 'Images'),
            ('POSTER_PERFECT', 'Poster Perfect', 'Change the poster for 5 different games or apps.', 'GalleryThumbnails'),
            ('TASTEMAKER', 'Tastemaker', 'Get a game recommendation from the AI.', 'Wand2');
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`user_achievements\` (
              \`id\` int(11) NOT NULL AUTO_INCREMENT,
              \`user_id\` int(11) NOT NULL,
              \`achievement_id\` varchar(255) NOT NULL,
              \`unlocked_at\` timestamp NOT NULL DEFAULT current_timestamp(),
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`user_achievement_unique\` (\`user_id\`,\`achievement_id\`),
              KEY \`achievement_id\` (\`achievement_id\`),
              CONSTRAINT \`user_achievements_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`social_users\` (\`id\`) ON DELETE CASCADE,
              CONSTRAINT \`user_achievements_ibfk_2\` FOREIGN KEY (\`achievement_id\`) REFERENCES \`achievements\` (\`id\`) ON DELETE CASCADE
            );
        `);
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`friends\` (
              \`id\` int NOT NULL AUTO_INCREMENT,
              \`user_one_id\` int NOT NULL,
              \`user_two_id\` int NOT NULL,
              \`status\` enum('pending','accepted','blocked') NOT NULL,
              \`action_user_id\` int NOT NULL,
              \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`unique_friendship\` (\`user_one_id\`,\`user_two_id\`),
              KEY \`user_two_id\` (\`user_two_id\`),
              CONSTRAINT \`friends_ibfk_1\` FOREIGN KEY (\`user_one_id\`) REFERENCES \`social_users\` (\`id\`) ON DELETE CASCADE,
              CONSTRAINT \`friends_ibfk_2\` FOREIGN KEY (\`user_two_id\`) REFERENCES \`social_users\` (\`id\`) ON DELETE CASCADE
            );
        `);

        console.log('[SOCIAL-DB] Database schema is ready.');
        isDbInitialized = true;
    } catch (error) {
        console.error('[SOCIAL-DB] Failed to initialize database schema:', error);
    } finally {
        if (connection) connection.release();
    }
}


type AuthResult = {
  success: boolean;
  message: string;
  user?: { id: number; username: string; email: string; avatar_url: string | null };
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide-react icon name
  unlocked_at: string | null;
};

export type SocialFriend = {
    id: number;
    username: string;
    avatar_url: string | null;
};

export type SocialFriendWithActivity = {
    id: number;
    username: string;
    avatar_url: string | null;
    activity_status: string | null;
    activity_details: string | null;
};

export type PendingRequest = {
    id: number;
    username: string;
    avatar_url: string | null;
};

export type FriendshipStatus = 'not_friends' | 'pending_sent' | 'pending_received' | 'friends' | 'self';

export type SearchedUser = {
    id: number;
    username: string;
    avatar_url: string | null;
    friendshipStatus: FriendshipStatus;
};

async function grantAchievement(userId: number, achievementId: string, connection: PoolConnection): Promise<boolean> {
    const [result]: any = await connection.execute(
        'INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
        [userId, achievementId]
    );
    return result.affectedRows > 0;
}


export async function registerUser({ username, email, password }: Record<string, string>): Promise<AuthResult> {
  await initializeDatabase();
  if (!username || !email || !password) {
    return { success: false, message: 'All fields are required.' };
  }
  
  const defaultAvatar = 'https://static.wikia.nocookie.net/925fa2de-087e-47f4-8aed-4f5487f0a78c/scale-to-width/755';

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existingUsername]: any = await connection.execute('SELECT id FROM social_users WHERE username = ?', [username]);
    if (existingUsername.length > 0) {
        await connection.rollback();
        return { success: false, message: 'This username is already taken.' };
    }

    const [existingEmail]: any = await connection.execute('SELECT id FROM social_users WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
        await connection.rollback();
        return { success: false, message: 'This email is already in use.' };
    }

    const [result]: any = await connection.execute(
      'INSERT INTO social_users (username, email, password, avatar_url) VALUES (?, ?, ?, ?)',
      [username, email, password, defaultAvatar]
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
    await initializeDatabase();
    if (!email || !password) {
        return { success: false, message: 'Email and password are required.' };
    }
    
    let connection;
    try {
        connection = await pool.getConnection();

        const [rows]: any = await connection.execute(
            'SELECT id, username, email, password, avatar_url FROM social_users WHERE email = ?',
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
            user: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url },
        };
    } catch (error: any) {
        console.error('[SOCIAL-DB] Login Error:', error);
        return { success: false, message: 'A database error occurred.' };
    } finally {
        if (connection) connection.release();
    }
}

export async function updateUserActivity(userId: number, status: string | null, details: string | null): Promise<{ success: boolean }> {
  await initializeDatabase();
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
  await initializeDatabase();
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
    avatar_url: string | null;
    created_at: string;
    activity_status: string | null;
    activity_details: string | null;
    achievements: Achievement[];
    friends: SocialFriendWithActivity[];
};

export async function getSocialProfile(userId: number): Promise<SocialProfile | null> {
    await initializeDatabase();
    if (!userId) return null;
    let connection;
    try {
        connection = await pool.getConnection();
        const [profileRows]: any = await connection.execute(`
            SELECT
                u.username,
                u.avatar_url,
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
            FROM achievements a
            LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
            ORDER BY ua.unlocked_at IS NULL, ua.unlocked_at DESC, a.name ASC
        `, [userId]);

        const friends = await getFriends(userId, connection);

        return {
            ...profileRows[0],
            achievements: achievementRows,
            friends: friends
        };

    } catch (error) {
        console.error(`[SOCIAL-DB] Error fetching profile for user ${userId}:`, error);
        return null;
    } finally {
        if (connection) connection.release();
    }
}


export async function checkAndAwardAchievements(userId: number, criteria: { gameCount?: number; profileCount?: number; storeHistoryCount?: number; friendCount?: number; launchedAppCount?: number; totalPlaytimeHours?: number; lastSessionHours?: number; }): Promise<string[]> {
    await initializeDatabase();
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

        if (criteria.gameCount !== undefined) {
            if (criteria.gameCount >= 10 && !existingIds.has('COLLECTOR_2')) {
                if (await grantAchievement(userId, 'COLLECTOR_2', connection)) newlyAwarded.push('Adept Collector');
            }
            if (criteria.gameCount >= 5 && !existingIds.has('COLLECTOR_1')) {
                if (await grantAchievement(userId, 'COLLECTOR_1', connection)) newlyAwarded.push('Novice Collector');
            }
        }

        if (criteria.profileCount !== undefined && criteria.profileCount > 1 && !existingIds.has('SOCIALITE')) {
            if (await grantAchievement(userId, 'SOCIALITE', connection)) newlyAwarded.push('Socialite');
        }

        if (criteria.storeHistoryCount !== undefined && criteria.storeHistoryCount >= 10 && !existingIds.has('APP_STORE_EXPLORER')) {
            if (await grantAchievement(userId, 'APP_STORE_EXPLORER', connection)) newlyAwarded.push('App Store Explorer');
        }
        
        if (criteria.friendCount !== undefined) {
             if (criteria.friendCount >= 5 && !existingIds.has('NETWORKER')) {
                if (await grantAchievement(userId, 'NETWORKER', connection)) newlyAwarded.push('Networker');
            }
            if (criteria.friendCount >= 1 && !existingIds.has('FIRST_CONTACT')) {
                if (await grantAchievement(userId, 'FIRST_CONTACT', connection)) newlyAwarded.push('First Contact');
            }
        }
        
        if (criteria.launchedAppCount !== undefined && criteria.launchedAppCount >= 5 && !existingIds.has('APP_CONNOISSEUR')) {
            if (await grantAchievement(userId, 'APP_CONNOISSEUR', connection)) newlyAwarded.push('App Connoisseur');
        }

        if (criteria.totalPlaytimeHours !== undefined) {
            if (criteria.totalPlaytimeHours >= 50 && !existingIds.has('PLAYTIME_3')) {
                if (await grantAchievement(userId, 'PLAYTIME_3', connection)) newlyAwarded.push('Hardcore Gamer');
            }
            if (criteria.totalPlaytimeHours >= 10 && !existingIds.has('PLAYTIME_2')) {
                if (await grantAchievement(userId, 'PLAYTIME_2', connection)) newlyAwarded.push('Dedicated Gamer');
            }
            if (criteria.totalPlaytimeHours >= 1 && !existingIds.has('PLAYTIME_1')) {
                if (await grantAchievement(userId, 'PLAYTIME_1', connection)) newlyAwarded.push('Apprentice Gamer');
            }
        }

        if (criteria.lastSessionHours !== undefined) {
            if (criteria.lastSessionHours >= 4 && !existingIds.has('SESSION_2')) {
                if (await grantAchievement(userId, 'SESSION_2', connection)) newlyAwarded.push('Marathon Runner');
            }
            if (criteria.lastSessionHours >= 2 && !existingIds.has('SESSION_1')) {
                if (await grantAchievement(userId, 'SESSION_1', connection)) newlyAwarded.push('Focused Player');
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


export async function sendFriendRequest(requesterId: number, addresseeId: number): Promise<{ success: boolean; message: string }> {
    await initializeDatabase();
    if (requesterId === addresseeId) return { success: false, message: "You cannot add yourself as a friend." };

    const [userOneId, userTwoId] = [requesterId, addresseeId].sort((a, b) => a - b);
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.execute(
            'INSERT INTO friends (user_one_id, user_two_id, status, action_user_id) VALUES (?, ?, ?, ?)',
            [userOneId, userTwoId, 'pending', requesterId]
        );
        return { success: true, message: 'Friend request sent!' };
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return { success: false, message: 'A friend request is already pending.' };
        }
        console.error('[SOCIAL-DB] Send Friend Request Error:', error);
        return { success: false, message: 'A database error occurred.' };
    } finally {
        if (connection) connection.release();
    }
}

export async function respondToFriendRequest(userId: number, requesterId: number, action: 'accept' | 'decline'): Promise<{ success: boolean; message: string; newAchievements?: string[] }> {
    await initializeDatabase();
    const [userOneId, userTwoId] = [userId, requesterId].sort((a, b) => a - b);
    let connection;
    let newAchievements: string[] = [];
    
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        if (action === 'accept') {
            await connection.execute(
                'UPDATE friends SET status = ?, action_user_id = ? WHERE user_one_id = ? AND user_two_id = ? AND status = "pending"',
                ['accepted', userId, userOneId, userTwoId]
            );

            // Check achievements for both users
            const [user1Friends]: any = await connection.execute('SELECT COUNT(*) as count FROM friends WHERE (user_one_id = ? OR user_two_id = ?) AND status = "accepted"', [userId, userId]);
            const [user2Friends]: any = await connection.execute('SELECT COUNT(*) as count FROM friends WHERE (user_one_id = ? OR user_two_id = ?) AND status = "accepted"', [requesterId, requesterId]);

            const user1Achievements = await checkAndAwardAchievements(userId, { friendCount: user1Friends[0].count });
            const user2Achievements = await checkAndAwardAchievements(requesterId, { friendCount: user2Friends[0].count });
            newAchievements = [...user1Achievements, ...user2Achievements];

            await connection.commit();
            return { success: true, message: 'Friend request accepted.', newAchievements };
        } else {
            await connection.execute(
                'DELETE FROM friends WHERE user_one_id = ? AND user_two_id = ?',
                [userOneId, userTwoId]
            );
            await connection.commit();
            return { success: true, message: 'Friend request declined.' };
        }
    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error('[SOCIAL-DB] Respond to Friend Request Error:', error);
        return { success: false, message: 'A database error occurred.' };
    } finally {
        if (connection) connection.release();
    }
}

export async function getFriendshipStatus(userOneId: number, userTwoId: number): Promise<FriendshipStatus> {
    await initializeDatabase();
    if (userOneId === userTwoId) return 'self';

    const [id1, id2] = [userOneId, userTwoId].sort((a, b) => a - b);
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows]: any = await connection.execute(
            'SELECT status, action_user_id FROM friends WHERE user_one_id = ? AND user_two_id = ?',
            [id1, id2]
        );
        if (rows.length === 0) return 'not_friends';

        const friendship = rows[0];
        if (friendship.status === 'accepted') return 'friends';
        if (friendship.status === 'pending') {
            return friendship.action_user_id === userOneId ? 'pending_sent' : 'pending_received';
        }

        return 'not_friends';
    } catch (error) {
        console.error('[SOCIAL-DB] Get Friendship Status Error:', error);
        return 'not_friends';
    } finally {
        if (connection) connection.release();
    }
}

export async function getPendingRequests(userId: number): Promise<PendingRequest[]> {
    await initializeDatabase();
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows]: any = await connection.execute(`
            SELECT u.id, u.username, u.avatar_url 
            FROM friends f
            JOIN social_users u ON u.id = f.action_user_id
            WHERE (f.user_one_id = ? OR f.user_two_id = ?) 
              AND f.status = 'pending' 
              AND f.action_user_id != ?
        `, [userId, userId, userId]);
        return rows;
    } catch (error) {
        console.error('[SOCIAL-DB] Get Pending Requests Error:', error);
        return [];
    } finally {
        if (connection) connection.release();
    }
}

export async function getFriends(userId: number, existingConnection?: PoolConnection): Promise<SocialFriendWithActivity[]> {
    await initializeDatabase();
    const connection = existingConnection || await pool.getConnection();
    try {
        const [rows]: any = await connection.execute(`
            SELECT 
                u.id, 
                u.username,
                u.avatar_url,
                sa.activity_status,
                sa.activity_details
            FROM social_users u
            JOIN friends f ON (u.id = f.user_one_id OR u.id = f.user_two_id)
            LEFT JOIN social_activities sa ON u.id = sa.user_id
            WHERE (f.user_one_id = ? OR f.user_two_id = ?)
              AND f.status = 'accepted'
              AND u.id != ?
        `, [userId, userId, userId]);
        return rows;
    } catch (error) {
        console.error('[SOCIAL-DB] Get Friends Error:', error);
        return [];
    } finally {
        if (!existingConnection && connection) (connection as PoolConnection).release();
    }
}


export async function searchUsers(query: string, currentUserId: number): Promise<SearchedUser[]> {
    await initializeDatabase();
    if (!query) return [];

    let connection;
    try {
        connection = await pool.getConnection();
        const [users]: any = await connection.execute(
            `SELECT id, username, avatar_url FROM social_users WHERE username LIKE ? AND id != ? LIMIT 10`,
            [`%${query}%`, currentUserId]
        );

        if (users.length === 0) return [];
        
        const usersWithStatus = await Promise.all(users.map(async (user: { id: number; username: string; avatar_url: string | null; }) => {
            const status = await getFriendshipStatus(currentUserId, user.id);
            return {
                id: user.id,
                username: user.username,
                avatar_url: user.avatar_url,
                friendshipStatus: status
            };
        }));

        return usersWithStatus.filter(user => user.friendshipStatus !== 'friends');
    } catch (error) {
        console.error(`[SOCIAL-DB] Error searching users for query "${query}":`, error);
        return [];
    } finally {
        if (connection) connection.release();
    }
}

export async function updateSocialAvatar(userId: number, avatarUrl: string): Promise<{ success: boolean; message: string }> {
  await initializeDatabase();
  if (!avatarUrl) {
    return { success: false, message: 'Avatar URL cannot be empty.' };
  }
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.execute('UPDATE social_users SET avatar_url = ? WHERE id = ?', [avatarUrl, userId]);
    return { success: true, message: "Avatar updated successfully." };
  } catch (error) {
    console.error(`[SOCIAL-DB] Error updating avatar for user ${userId}:`, error);
    return { success: false, message: "A database error occurred." };
  } finally {
    if (connection) connection.release();
  }
}
