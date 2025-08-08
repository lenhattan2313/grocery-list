export const config = {
  db: {
    url: process.env.DATABASE_URL,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  pusher: {
    appId: process.env.PUSHER_APP_ID,
    secret: process.env.PUSHER_SECRET,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  },
  publicPusher: {
    key: process.env.NEXT_PUBLIC_PUSHER_KEY,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  },
  openai: {
    apiKey: process.env.GITHUB_TOKEN,
  },
  push: {
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
    vapidSubject: process.env.VAPID_SUBJECT || "mailto:your-email@example.com",
  },
};
