import bcrypt from "bcrypt";
import cors from "cors";
import dotenv from 'dotenv';
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Expense from "./schemas/expense.js";
import Income from "./schemas/income.js";
import User from "./schemas/user.js";
dotenv.config();

//Configure server and CORS.

const app = express();
const router = express.Router();
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
      body: { email, password },
    } = req;

    const user = await User.findOne({ email: email });

    const { userName, _id } = user;
    const incomeArray = await Income.find({ "userId": _id })
    const expenseArray = await Expense.find({ "userId": _id })
    console.log(incomeArray)
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        const accessToken = jwt.sign({ id: user._id }, "secret", {
          expiresIn: 60 * 60,
        });
        res.json({
          body: { accessToken, user: { email, userName, password }, incomeArray, expenseArray },
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
      res.send("User already exists");
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


app.get("/isUserAuthenticated", async (req, res, next) => {
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

app.post("/createIncome", async (req, res, next) => {
  let token;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }

    [, token] = authHeader.split(" ");
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(err);
    }

    const userId = decoded.id;

    const { category, description, amount, recurrence } = req.body;

    const newIncome = new Income({
      category,
      description,
      amount,
      recurrence,
      userId
    });

    const savedIncome = await newIncome.save();
    const incomeArray = await Income.find({ "userId": userId })
    res.json({savedIncome, incomeArray});
  } catch (error) {
    console.error(error);
    next(error);
  }
});

app.post("/createExpense", async (req, res, next) => {
  let token;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }

    [, token] = authHeader.split(" ");
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(err);
    }

    const userId = decoded.id;

    const { category, description, amount, recurrence } = req.body;

    const newExpense = new Expense({
      category,
      description,
      amount,
      recurrence,
      userId
    });

    const savedExpense = await newExpense.save();
    const expenseArray = await Expense.find({ "userId": userId })
    res.json({savedExpense, expenseArray});
  } catch (error) {
    console.error(error);
    next(error);
  }
});

app.put("/updateIncome/:incomeId", async (req, res, next) => {
  let token;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next;
    }

    [, token] = authHeader.split(" ");
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(err)
    }

    const userId = decoded.id;
    const { incomeId } = req.params;
    const { category, description, amount, recurrence } = req.body;

    const incomeArray = await Income.find({ "userId": userId })

    Income.findByIdAndUpdate(
      incomeId,
      { category, description, amount, recurrence, userId },
      { new: true }
    )
      .then(updatedIncome => {
        if (!updatedIncome) {
          return res.status(404).send("Income not found");
        }
        res.json({updatedIncome, incomeArray});
      })
      .catch(err => {
        console.error(err);
        res.status(500).send("Error updating income");
      });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

app.put("/updateExpense/:expenseId", async (req, res, next) => {
  let token;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next;
    }

    [, token] = authHeader.split(" ");
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(err)
    }

    const userId = decoded.id;
    const { expenseId } = req.params;
    const { category, description, amount, recurrence } = req.body;

    const expenseArray = await Expense.find({ "userId": userId })

    Expense.findByIdAndUpdate(
      expenseId,
      { category, description, amount, recurrence, userId },
      { new: true }
    )
      .then(updatedExpense => {
        if (!updatedExpense) {
          return next();
        }
        res.json({updatedExpense, expenseArray});
      })
      .catch(err => {
        console.error(err);
        next(err);
      });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

app.get('/getExpense/:expenseId', async (req, res, next) => {
  let token;
  try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
          return next()
      }

      token = authHeader.split(" ")[1];

      console.log(token)

      let decoded;
      try {
          decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
          return next(err);
      }

      const { expenseId } = req.params;
      console.log(expenseId)
      const expense = await Expense.findOne({ _id: expenseId});
      
      if (!expense) {
          return res.status(404).send('Expense not found');
      }

      res.json(expense);
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

app.get('/getIncome/:incomeId', async (req, res, next) => {
  let token;
  try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
          return next();
      }

      token = authHeader.split(" ")[1];

      console.log(token);

      let decoded;
      try {
          decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
          return next(err);
      }

      const { incomeId } = req.params;
      console.log(incomeId);
      const income = await Income.findOne({ _id: incomeId });
      
      if (!income) {
          return res.status(404).send('Income not found');
      }

      res.json(income);
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

app.delete('/deleteIncome/:incomeId', async (req, res) => {
  try {
      const { incomeId } = req.params;

      const deletedIncome = await Income.findByIdAndDelete(incomeId);

      if (!deletedIncome) {
          return res.status(404).send('Income not found');
      }

      res.send(`Income with ID ${incomeId} has been deleted`);
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

app.delete('/deleteExpense/:expenseId', async (req, res) => {
  try {
      const { expenseId } = req.params;

      const deletedExpense = await Expense.findByIdAndDelete(expenseId);

      if (!deletedExpense) {
          return res.status(404).send('Expense not found');
      }

      res.send(`Expense with ID ${expenseId} has been deleted`);
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});


app.get('/getAllIncomes', async (req, res) => {
  try {
      const incomes = await Income.find({});
      res.json(incomes);
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

app.get('/getAllExpenses', async (req, res) => {
  try {
      const expenses = await Expense.find({});
      res.json(expenses);
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});


app.listen(process.env.PORT, async () => {
  await connectToMongoDB();
  //await deleteAllUsers();
  await fetchAllUsers();
  console.log("Running on https://jvac-backend.adaptable.app/");
});
