import bcrypt from "bcrypt";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "./schemas/user.js";
import dotenv from 'dotenv';
dotenv.config();

//Configure server and CORS.

const app = express();
app.use(express.json());
app.use(cors());
app.options("*", cors());

async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      authSource: "admin",
    });
    console.log("Connected to Mongo");
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
    process.exit(1); // Exit process with failure
  }
}
// async function deleteAllUsers() {
//   try {
//     await User.deleteMany({});
//     console.log("All users deleted");
//   } catch (err) {
//     console.error("Error deleting users:", err);
//   }
// }

const fetchAllUsers = async () => {
  try {
    const users = await User.find({});
    console.log(users);
  } catch (err) {
    console.error("Error fetching users:", err);
  }
};
const checkForUser = async (email) => {
  try {
    const user = await User.findOne({ email: email });
    return user ? true : false;
  } catch (err) {
    console.error(err);
  }
};

app.post("/login", async (req, res, next) => {
  try {
    const {
      body: { userName, password },
    } = req;

    const user = await User.findOne({ userName: userName });
    const { email } = user;
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        const accessToken = jwt.sign({ id: user._id }, "secret", {
          expiresIn: 60 * 60,
        });
        res.json({
          body: { accessToken, user: {email, userName, password} },
        });
      } else {
        res.status(400).send("Invalid credentials");
      }
    } else {
      res.status(400).send("Invalid credentials");
    }
  } catch (error) {
    console.error(error)
    next(error)
  }
});

app.post("/signup", async (req, res, next) => {
  const {
    body: { email, password, userName },
  } = req;

  try {
    if ((await checkForUser(email)) === true) {
      console.log("Already Exists");
      res.status(400).send("User already exists");
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new User({
      email,
      password: hashedPassword,
      userName,
    });
    const savedUser = await newUser.save();
    const accessToken = jwt.sign({ id: savedUser._id }, "secret", {
      expiresIn: 60 * 60,
    });
    console.log(savedUser);
    res.json({
      body: {
        user: {
          email,
          userName,
        },
        accessToken,
      },
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

app.get("/isUserAuthenticated", async (req, res, next)  => {
    console.log("inside endpoint");
    let id, token;
    try {
        [, token] = req.headers.authorization.split(" ");
        jwt.verify(token, "secret", (err, decoded) => {
          if (err) throw err;
          ({ id } = decoded);
        });
        const user = await User.findOne({ _id: id })
        console.log(user);
        const { email, userName } = user;
        res.json({
          body: {
            email, 
            userName
          },
        });
      } catch (error) {
        console.error(error);
        next(error);
      }
    
});

app.listen(4000, async () => {
  await connectToMongoDB();
  //await deleteAllUsers();
  await fetchAllUsers();
  console.log("Running on Port 4000");
});
