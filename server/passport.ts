import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";
import type { User } from "@shared/schema";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("Google OAuth credentials not configured. Google Sign-In will not be available.");
}

export function setupPassport() {
  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            const googleId = profile.id;
            const name = profile.displayName;
            const profilePictureUrl = profile.photos?.[0]?.value;

            if (!email) {
              return done(new Error("No email found in Google profile"));
            }

            console.log(`[Google OAuth] Processing login for: ${email.substring(0, 3)}***`);

            let user = await storage.getUserByGoogleId(googleId);

            if (user) {
              console.log(`[Google OAuth] Found existing user by Google ID`);
              return done(null, user);
            }

            user = await storage.getUserByEmail(email);

            if (user) {
              console.log(`[Google OAuth] Found existing user by email, linking Google account`);
              user = await storage.linkGoogleAccount(user.id, googleId, name, profilePictureUrl);
              return done(null, user);
            }

            console.log(`[Google OAuth] Creating new user account`);
            user = await storage.createGoogleUser(email, googleId, name, profilePictureUrl);

            await storage.createSubscription(user.id, 'free');

            return done(null, user);
          } catch (error) {
            console.error("[Google OAuth] Error during authentication:", error);
            return done(error as Error);
          }
        }
      )
    );
  }
}
