import express from "express"; 
import cors from "cors";
import jwt from "jsonwebtoken";

const app = express();

app.use(express.json());
app.use(cors());

app.options("*", cors());
app.listen(8080, () => {
    console.log("Running on Port 8080");
});