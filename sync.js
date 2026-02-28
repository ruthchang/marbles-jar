/**
 * Optional cloud sync using Supabase.
 * When configured, allows users to sign in and sync their habit jar across devices.
 */
(function(global) {
    'use strict';

    const isConfigured = () => typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY;
    let client = null;
    let authListener = null;

    function getClient() {
        if (!isConfigured() || !global.supabase) return null;
        if (!client) client = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return client;
    }

    function init() {
        if (!isConfigured()) return;
        const sb = getClient();
        if (!sb) return;

        authListener = sb.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                if (typeof global.onSyncAuthChange === 'function') {
                    global.onSyncAuthChange(true, session.user);
                }
            } else if (event === 'SIGNED_OUT') {
                if (typeof global.onSyncAuthChange === 'function') {
                    global.onSyncAuthChange(false, null);
                }
            }
        });
    }

    async function getSession() {
        const sb = getClient();
        if (!sb) return null;
        const { data } = await sb.auth.getSession();
        return data?.session ?? null;
    }

    async function signIn(email, password) {
        const sb = getClient();
        if (!sb) throw new Error('Sync not configured');
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    }

    async function signUp(email, password) {
        const sb = getClient();
        if (!sb) throw new Error('Sync not configured');
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        return data;
    }

    async function signOut() {
        const sb = getClient();
        if (sb) await sb.auth.signOut();
    }

    async function pushState(stateData) {
        const session = await getSession();
        if (!session) return false;
        const sb = getClient();
        if (!sb) return false;

        const { error } = await sb
            .from('app_state')
            .upsert({
                user_id: session.user.id,
                data: stateData,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (error) {
            console.warn('Sync push failed:', error);
            return false;
        }
        return true;
    }

    async function pullState() {
        const session = await getSession();
        if (!session) return null;
        const sb = getClient();
        if (!sb) return null;

        const { data, error } = await sb
            .from('app_state')
            .select('data, updated_at')
            .eq('user_id', session.user.id)
            .single();

        if (error || !data) return null;
        return data;
    }

    global.Sync = {
        isConfigured,
        init,
        getSession,
        signIn,
        signUp,
        signOut,
        pushState,
        pullState
    };
})(typeof window !== 'undefined' ? window : this);
