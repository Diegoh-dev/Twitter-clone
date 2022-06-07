const express = require("express");

const cors = require("cors");

const { PrismaClient } = require("@prisma/client");

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const port = 9901;

const app = express();

const prisma = new PrismaClient();

app.use(express.json());

app.use(cors());

app.get("/tweets", async (req, res) => {
  const [, token] = req.headers?.authorization?.split(" ") || [];
  // console.log(token);
  if (!token) {
    return res.status(401);
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    const tweets = await prisma.tweet.findMany();
    return res.json(tweets);
  } catch (error) {
    console.log("caiu no cacth");
    return res.status(401);
  }
});

app.post("/tweets", async (req, res) => {
  const [, token] = req.headers?.authorization?.split(" ") || "";

  if (!token) {
    return res.status(401);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const tweet = await prisma.tweet.create({
      data: {
        userId: payload.sub,
        text: req.body.text,
      },
    });

    return res.json(tweet);
  } catch (error) {
    return res.status(401);
  }
});

/*eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbDN6Y2E4N2owMDAweDRuMmRyanZ0N3ZjIiwiaWF0IjoxNjU0NTM5NDUyLCJleHAiOjE2NTQ2MjU4NTJ9.-cmz8vTBf3iU_CfFVWIXLC1XWwid_JvyAoA3_S8bhFo */

app.post("/signup", async (req, res) => {
  const { name, username, email, password } = req.body;

  const saltRounds = 10;
  const passwordCript = bcrypt.hashSync(password, saltRounds);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: passwordCript,
      },
    });

    // console.log(req.body);

    return res.json({
      id: user.id,
      name,
      username,
      email,
    });
  } catch (error) {
    if (error.meta && !error.meta.target) {
      res.status(422);
      res.json("Email ou nome de usuário já existe");
      return;
    }
    res.status(500);
    res.json("Internal error");
  }
});

app.get("/login", async (req, res) => {
  // const password = req.headers.authorization;

  // console.log(password);
  const [, token] = req.headers.authorization.split(" ");
  const [email, plainTextPassword] = Buffer.from(token, "base64")
    .toString()
    .split(":");

  // console.log(email);
  // console.log(plainTextPassword);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // console.log({ user });

  if (!user) {
    return res.status(404).json();
  }

  const passwordMatch = bcrypt.compareSync(plainTextPassword, user.password);

  if (passwordMatch) {
    const accessToken = jwt.sign(
      {
        sub: user.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    return res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      accessToken,
    });
  }

  return res.status(404).json();
});

app.listen(port, () => console.log("server is running"));
