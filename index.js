import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "./schemas/user.js";
//Configure server and CORS.

const app = express();
app.use(express.json());
app.use(cors());
app.options("*", cors());

async function connectToMongoDB() {
  try {
    await mongoose.connect(
      "mongodb://root:example@localhost:27017/myDatabase",
      {
        authSource: "admin",
      }
    );
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
    const accessToken = jwt.sign({id: savedUser._id}, "secret", { expiresIn: 60 * 60 });
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
app.listen(8080, async () => {
  await connectToMongoDB();
  //await deleteAllUsers();
  await fetchAllUsers();
  console.log("Running on Port 8080");
});
