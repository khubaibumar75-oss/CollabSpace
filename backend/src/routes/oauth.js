const { Router } = require("express");
const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const { Strategy: GitHubStrategy } = require("passport-github2");
const prisma = require("../lib/prisma");
const { signAccessToken, createRefreshToken } = require("../utils/tokens");

const router = Router();

function setupOAuth() {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  // Google Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${process.env.BACKEND_URL}/api/oauth/google/callback`,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(null, false);

            let user = await prisma.user.findFirst({
              where: { OR: [{ googleId: profile.id }, { email }] },
            });

            if (!user) {
              user = await prisma.user.create({
                data: { email, googleId: profile.id },
              });
            } else if (!user.googleId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id },
              });
            }
            done(null, user);
          } catch (err) {
            done(err);
          }
        }
      )
    );
  }

  // GitHub Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          // FIX: Now using absolute URL
          callbackURL: `${process.env.BACKEND_URL}/api/oauth/github/callback`,
          scope: ["user:email"],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(null, false);

            let user = await prisma.user.findFirst({
              where: { OR: [{ githubId: profile.id }, { email }] },
            });

            if (!user) {
              user = await prisma.user.create({
                data: { email, githubId: profile.id },
              });
            } else if (!user.githubId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { githubId: profile.id },
              });
            }
            done(null, user);
          } catch (err) {
            done(err);
          }
        }
      )
    );
  }

  async function handleOAuthCallback(req, res) {
    const user = req.user;
    if (!user) {
      return res.redirect(`${clientUrl}/login?error=oauth_failed`);
    }

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = await createRefreshToken(user.id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${clientUrl}/oauth-callback?token=${accessToken}`);
  }

  // Routes
  if (process.env.GOOGLE_CLIENT_ID) {
    router.get(
      "/google",
      passport.authenticate("google", { scope: ["profile", "email"], session: false })
    );
    router.get(
      "/google/callback",
      passport.authenticate("google", { session: false, failureRedirect: `${clientUrl}/login?error=oauth_failed` }),
      handleOAuthCallback
    );
  }

  if (process.env.GITHUB_CLIENT_ID) {
    router.get(
      "/github",
      passport.authenticate("github", { session: false })
    );
    router.get(
      "/github/callback",
      passport.authenticate("github", { session: false, failureRedirect: `${clientUrl}/login?error=oauth_failed` }),
      handleOAuthCallback
    );
  }
}

setupOAuth();

module.exports = router;