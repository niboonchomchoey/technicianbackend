module.exports = ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),
  url: "http://localhost:1337",
  admin: {
    auth: {
      secret: env("ADMIN_JWT_SECRET", "2b0b2d5133a3c9f84d49e9185e5fb295"),
    },
  },
});
