/**
 * Public sign-up is CLOSED by default. Set `ALLOW_REGISTRATION=true` to open it
 * (e.g. to create your own account once), then unset it to lock everyone out.
 * Guards the register page, the registerUser action, and new OAuth accounts.
 */
export const registrationOpen = process.env.ALLOW_REGISTRATION === 'true';
