
'use server';

import { updateConfig } from '@/lib/config';

type SettingsPayload = {
  browser?: string;
}

export async function saveSystemSettings(settings: SettingsPayload): Promise<{ success: boolean; error?: string }> {
    try {
        // We only update settings managed by this action.
        // `setupconfig` is handled by the setup wizard actions.
        await updateConfig({ browser: settings.browser });
        return { success: true };
    } catch (error) {
        console.error("Failed to save system settings:", error);
        const errorMessage = error instanceof Error ? error.message : "Could not update config.ini";
        return { success: false, error: errorMessage };
    }
}
