import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      callbackURL:
        process.env.GITHUB_CALLBACK_URL || "http://localhost:3000/api/auth/github/callback",
      scope: ["user:email", "repo"],
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: (error: any, user?: any) => void
    ) => {
      try {
        const githubId = profile.id.toString();
        const username = profile.username || profile.displayName || `user-${githubId}`;
        const email = profile.emails?.[0]?.value || null;
        const avatarUrl = profile.photos?.[0]?.value || null;

        let user = await prisma.user.findUnique({
          where: { githubId: githubId },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              username,
              githubId,
              email,
              avatarUrl,
              githubToken: accessToken,
            },
          });
        } else {
          // Update user info and token in case it changed on GitHub
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              username,
              email,
              avatarUrl,
              githubToken: accessToken,
            },
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, undefined);
      }
    }
  )
);

export default passport;
