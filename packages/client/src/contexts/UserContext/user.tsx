import { useSession, authClient } from "@/lib/auth-client";

export function User() {
    const { data: session, isPending } = useSession();

    // Provide a safe refresh function that callers can use to attempt
    // to re-fetch the session. It does not try to update any global
    // state here (the UserProvider manages app-level session state),
    // but it will call the auth client and return the session if needed.
        const refreshUser = async (): Promise<void> => {
            try {
                await authClient.getSession();
            } catch {
                // swallow errors - callers expect a promise but context will
                // surface errors via UserProvider where applicable
            }
        };

    return {
        user: session?.user ?? null,
        isLoading: isPending,
        error: null,
        refreshUser,
    };
}