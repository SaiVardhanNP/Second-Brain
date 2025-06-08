import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import z from "zod";
import jsonwebtoken from "jsonwebtoken";
import { contentModel, linkModel, userModel } from "./db";
import { authMiddleware } from "./middleware";
import { jwtsecretkey } from "./config";
import { random } from "./util";
const app = express();

app.use(express.json());

function requiredBody(data: { username: string; password: string }): boolean {
  const requiredBody = z.object({
    username: z.string().min(8).max(10),
    password: z
      .string()
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
      ),
  });
  const validData = requiredBody.safeParse(data);
  return validData.success;
}

app.post("/api/v1/signup", async (req, res) => {
  const { username, password } = req.body;
  const success = requiredBody(req.body);

  if (!success) {
    res.json({
      msg: "invalid format!",
    });
    return;
  }

  const hashed = await bcrypt.hash(password, 5);
  try {
    const data = await userModel.create({
      username: username,
      password: hashed,
    });

    res.json({
      msg: "Signed up successfully!",
    });
  } catch (e) {
    res.status(403).json({
      msg: "Invalid login details!",
    });
  }
});

app.post("/api/v1/signin", async (req, res) => {
  const { username, password } = req.body;
  const user = await userModel.findOne({
    username: username,
  });

  if (!user) {
    res.json({
      msg: "User is not found!",
    });
    return;
  }
  const comparePassword = await bcrypt.compare(password, user.password);
  if (!comparePassword) {
    res.send("password is incorrect!");
  }

  const token = jsonwebtoken.sign({ id: user._id }, jwtsecretkey);

  res.json({
    msg: "Signed in successfully!",
    token: token,
  });
});

app.post("/api/v1/content", authMiddleware, async (req, res) => {
  const { link, title, tags } = req.body;
  //@ts-ignore
  const userid = req.userid;
  try {
    const content = await contentModel.create({
      link: link,
      title: title,
      tags: [],
      //@ts-ignore
      userId: req.userid,
    });
    res.json({
      msg: "Content added!",
    });
  } catch (e) {
    res.json({
      msg: "invalid data",
    });
  }
});

app.get("/api/v1/content", authMiddleware, async (req, res) => {
  //@ts-ignore
  const userid = req.userid;

  const content = await contentModel
    .find({
      userId: userid,
    })
    .populate("userId", "username");
  res.json({
    content,
  });
});

app.delete("/api/v1/content", authMiddleware, async (req, res) => {
  const contentid = req.body.contentid;

  await contentModel.deleteMany({
    _id: contentid,
    //@ts-ignore
    userId: req.userid,
  });

  res.json({
    msg: "Deleted successfully!",
  });
});

app.post("/api/v1/brain/share", authMiddleware, async (req, res) => {
  const share = req.body.share;
  //@ts-ignore
  const userId = req.userid;

  if (share) {
    const user = await linkModel.findOne({
      userId: userId,
    });
    if (user) {
      res.json({
        hash: user.hash,
      });
      return;
    }

    const hash = random(10);
    await linkModel.create({
      userId: userId,
      hash: hash,
    });

    res.json({
      msg: hash,
    });
  } else {
    await linkModel.deleteOne({
      userId: userId,
    });
    res.json({
      msg: "updated share link!",
    });
  }
});

app.get("/api/v1/brain/:shareLink", async (req, res) => {
  const hash = req.params.shareLink;

  const link = await linkModel.findOne({
    hash,
  });
  if (!link) {
    res.json({
      msg: "Invalid link!",
    });
    return;
  }

  const content = await contentModel.findOne({
    userId: link.userId,
  });

  const user = await userModel.findOne({
    _id: link.userId,
  });

  res.json({
    username: user?.username,
    content: content,
  });
});

async function run() {
  app.listen(3000, () => {
    console.log("listening on port 3000");
  });
  await mongoose.connect(
    "mongodb+srv://saivardhannp:saivardhan11@mydatabase.vzet070.mongodb.net/second-brain"
  );
}

run();
