
// Mock users database
const users = [
    { id: '1', email: 'seller1@test.com', password: 'password123', user_metadata: { role: 'seller' } },
    { id: '2', email: 'seller2@test.com', password: 'password123', user_metadata: { role: 'seller' } },
    { id: '3', email: 'buyer1@test.com', password: 'password123', user_metadata: { role: 'buyer' } },
    { id: '4', email: 'buyer2@test.com', password: 'password123', user_metadata: { role: 'buyer' } },
];

// Mock Pavilions
const pavilions = [];

// Mock Messages
const messages = [];

let currentSession = null;
const subscribers = new Set();
const realtimeSubscribers = new Set(); // For table updates

const notifySubscribers = (event, session) => {
    subscribers.forEach((callback) => callback(event, session));
};

const notifyRealtime = (table, payload) => {
    realtimeSubscribers.forEach(cb => cb(table, payload));
};

export const mockSupabase = {
    auth: {
        signInWithPassword: async ({ email, password }) => {
            // simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));

            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                currentSession = {
                    access_token: 'mock-token',
                    user: {
                        id: user.id,
                        email: user.email,
                        user_metadata: user.user_metadata,
                    }
                };
                notifySubscribers('SIGNED_IN', currentSession);
                return { data: { session: currentSession, user: currentSession.user }, error: null };
            }

            return { data: { session: null, user: null }, error: { message: 'Invalid login credentials' } };
        },

        signUp: async ({ email, password, options }) => {
            await new Promise(resolve => setTimeout(resolve, 500));

            const exists = users.find(u => u.email === email);
            if (exists) {
                return { data: { user: null, session: null }, error: { message: 'User already exists' } };
            }

            const newUser = {
                id: Math.random().toString(36).substr(2, 9),
                email,
                password,
                user_metadata: options?.data || {}
            };

            users.push(newUser);

            return { data: { user: { id: newUser.id, email: newUser.email, user_metadata: newUser.user_metadata }, session: null }, error: null };
        },

        signOut: async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
            currentSession = null;
            notifySubscribers('SIGNED_OUT', null);
            return { error: null };
        },

        getSession: async () => {
            return { data: { session: currentSession }, error: null };
        },

        onAuthStateChange: (callback) => {
            subscribers.add(callback);
            // Immediately fire current state
            callback(currentSession ? 'SIGNED_IN' : 'SIGNED_OUT', currentSession);

            return {
                data: {
                    subscription: {
                        unsubscribe: () => {
                            subscribers.delete(callback);
                        }
                    }
                }
            };
        }
    },

    // Mock DB Methods
    from: (table) => {
        return {
            select: () => {
                return {
                    eq: (col, val) => {
                        let data = [];
                        if (table === 'pavilions') {
                            if (col === 'seller_id') data = pavilions.filter(p => p.seller_id === val);
                            else if (col === 'id') data = pavilions.filter(p => p.id === val);
                            else data = pavilions;
                        } else if (table === 'messages') {
                            if (col === 'pavilion_id') data = messages.filter(m => m.pavilion_id === val);
                            else data = messages;
                        }
                        return Promise.resolve({ data, error: null });
                    },
                    // handle simple select('*') without filters immediately if awaited, 
                    // but supabase usually chains. For mock, we can return a promise that resolves to all data if not chained?
                    // easier to just require .then or await on the chain.
                    // But in my code I do: await supabase.from('pavilions').select('*');
                    // So select() needs to return a Promise that has .eq attached?
                    // Or a "PostgrestBuilder" mock.
                    then: (resolve) => {
                        let data = [];
                        if (table === 'pavilions') data = pavilions;
                        if (table === 'messages') data = messages;
                        resolve({ data, error: null });
                    }
                };
            },
            insert: (row) => {
                const newRow = Array.isArray(row) ? row[0] : row;
                newRow.id = Math.random().toString(36).substr(2, 9);
                newRow.created_at = new Date().toISOString();

                if (table === 'pavilions') pavilions.push(newRow);
                if (table === 'messages') messages.push(newRow);

                notifyRealtime(table, { eventType: 'INSERT', new: newRow });
                return Promise.resolve({ data: [newRow], error: null });
            },
            update: (updates) => {
                return {
                    eq: (col, val) => {
                        let targetRow = null;
                        if (table === 'pavilions') {
                            targetRow = pavilions.find(p => p[col] === val);
                        }
                        if (targetRow) {
                            Object.assign(targetRow, updates);
                            notifyRealtime(table, { eventType: 'UPDATE', new: targetRow });
                            return Promise.resolve({ data: [targetRow], error: null });
                        }
                        return Promise.resolve({ data: null, error: 'Not found' });
                    }
                }
            },
            delete: () => {
                return {
                    eq: (col, val) => {
                        if (table === 'pavilions') {
                            const idx = pavilions.findIndex(p => p[col] === val);
                            if (idx !== -1) {
                                const deleted = pavilions.splice(idx, 1)[0];
                                notifyRealtime(table, { eventType: 'DELETE', old: deleted });
                                return Promise.resolve({ data: [deleted], error: null });
                            }
                        }
                        return Promise.resolve({ data: null, error: 'Not found' });
                    }
                }
            }
        };
    },

    // Realtime subscription mock
    channel: (name) => ({
        on: (type, config, callback) => {
            const wrapper = (table, payload) => {
                if (config.table === table) callback(payload);
            };
            realtimeSubscribers.add(wrapper);
            return {
                subscribe: () => { },
                unsubscribe: () => realtimeSubscribers.delete(wrapper)
            };
        },
        subscribe: () => ({}),
        unsubscribe: () => { } // Add this to prevent crash in App.jsx return cleanup
    }),

    removeChannel: (channel) => { } // Add this to prevent crash
};
