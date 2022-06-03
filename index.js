const express = require("express");

const { PrismaClient } = require("@prisma/client");

const port = 9901;

const app = express();

const prisma = new PrismaClient();

app.use(express.json());

app.get("/tweets", async (req, res) => {
  const tweets = await prisma.tweet.findMany();

  return res.json(tweets);
});

app.post("/tweets", async (req, res) => {
  const tweet = {
    userId: "cl3xywwh300146sn2rbjel5gi",
    text: req.body.text,
  };

  const doc = await prisma.tweet.create({
    data: tweet,
  });

  return res.json(doc);
});

app.listen(port, () => console.log("server is running"));
