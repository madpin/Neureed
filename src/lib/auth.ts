import NextAuth, { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "./db";
import { env } from "../env";

/**
 * NextAuth.js Configuration
 * 
 * Supports:
 * - Google OAuth
 * - GitHub OAuth
 * - Generic OAuth2 provider (configurable)
 */

// Build providers array dynamically based on environment variables
const providers: NextAuthConfig["providers"] = [];

// Add Google provider if configured
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

// Add GitHub provider if configured
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

// Add generic OAuth2 provider if configured
if (
  env.OAUTH_CLIENT_ID &&
  env.OAUTH_CLIENT_SECRET &&
  env.OAUTH_AUTHORIZATION_URL &&
  env.OAUTH_TOKEN_URL &&
  env.OAUTH_USERINFO_URL
) {
  providers.push({
    id: "oauth",
    name: env.OAUTH_PROVIDER_NAME,
    type: "oauth",
    clientId: env.OAUTH_CLIENT_ID,
    clientSecret: env.OAUTH_CLIENT_SECRET,
    authorization: {
      url: env.OAUTH_AUTHORIZATION_URL,
      params: { scope: "openid email profile" },
    },
    token: env.OAUTH_TOKEN_URL,
    userinfo: env.OAUTH_USERINFO_URL,
    issuer: env.OAUTH_ISSUER,
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
      };
    },
    allowDangerousEmailAccountLinking: true,
  });
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  trustHost: env.AUTH_TRUST_HOST,
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  events: {
    async createUser({ user }) {
      // Create default preferences for new users
      if (user.id) {
        // Check if preferences already exist (e.g., when linking accounts)
        const existingPreferences = await prisma.user_preferences.findUnique({
          where: { userId: user.id },
        });

        if (!existingPreferences) {
          await prisma.user_preferences.create({
            data: {
              id: `pref_${user.id}`,
              userId: user.id,
              theme: "system",
              fontSize: "medium",
              articlesPerPage: 20,
              defaultView: "expanded",
              showReadArticles: true,
              autoMarkAsRead: false,
              showRelatedExcerpts: false,
              bounceThreshold: 0.25,
              showLowRelevanceArticles: true,
              updatedAt: new Date(),
            },
          });
        }

        // Subscribe new user to default feeds
        const { subscribeUserToDefaultFeeds } = await import(
          "@/lib/services/default-feeds-service"
        );
        await subscribeUserToDefaultFeeds(user.id).catch((error) => {
          console.error("Failed to subscribe user to default feeds:", error);
          // Don't fail user creation if feed subscription fails
        });
      }
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

