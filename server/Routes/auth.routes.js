const router = require("express").Router();
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isAuthenticated } = require("../middlewares/jwt.middleware");
const UserModel = require("../models/User.model");

//Sign Up route
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const emailIsExist = await UserModel.findOne({ email });
    if (emailIsExist) {
      res.status(403).json({ message: "Invalid Credentials" });
    } else {
      const salt = bcryptjs.genSaltSync(12);
      const hashedPassword = bcryptjs.hashSync(password, salt);
      const hashedUser = {
        name,
        email,
        password: hashedPassword,
      };
      const createdUser = await UserModel.create(hashedUser);
      res.status(201).json(createdUser);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ erroMessage: "error on signup" });
  }
});

//Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log("hello");
    const userExist = await UserModel.findOne({ email });
    if (userExist) {
      // preparing the password check
      const dbPassword = userExist.password;
      const loginPassword = password;

      //Password check
      const passwordsMatch = bcryptjs.compareSync(loginPassword, dbPassword);
      if (passwordsMatch) {
        //Dealing with the token
        const { _id, name } = userExist;
        const payLoad = { _id, name };
        const authToken = jwt.sign(payLoad, process.env.TOKEN_SECRET, {
          algorithm: "HS256",
          expiresIn: "6h",
        });

        console.log("the auth token is :", authToken);

        //sending final response
        res
          .status(200)
          .json({ message: "login successed", authToken: authToken });
      } else {
        return res.status(500).json({ message: "login failed wrong password" });
      }
    } else {
      return res.status(500).json({ message: "login failed wrong email" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "login failed " });
  }
});

router.get("/verify", isAuthenticated, (req, res) => {
  console.log("made it to the /verify route", req.payLoad);
  res.status(200).json(req.payLoad.currentUser);
  // .json({ message: "user verified" });
  // .json({ message: "user verified", currentUser: req.payLoad.currentUser });
});

module.exports = router;
