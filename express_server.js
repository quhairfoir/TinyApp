const express = require("express");
const bodyParser = require("body-parser");
const cookies = require("cookie-parser");
const app = express();
const PORT = 8000;

app.set('view engine', 'ejs');
app.use(cookies());

const urlDatabase = {
  "b2xVn2": { 
    longURL: "http://www.lighthouselabs.ca",
    user: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    user: "user2RandomID"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

app.use(bodyParser.urlencoded({extended: true}));

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password){
    res.status(400);
    res.send("400: Email and password required!");
  } else {
  let newID = generateRandomString();
  users[newID] = {};
  users[newID].id = newID;
  users[newID].email = req.body.email;
  users[newID].password = req.body.password;
  res.cookie("user_id", newID);
  res.redirect("/urls");
  }
  console.log(users);
});

app.get("/", (req, res) => {
  if (req.cookies["user_id"]){
    res.redirect("/urls");
  }
  res.redirect("/login");
});

app.post("/login", (req, res) => {
  let userFound = false;
  let userName = "";
  for (let user in users) {
    if (users[user].email === req.body.email && users[user].password === req.body.password) {
      userFound = true;
      userName = users[user].id;
    } 
  }
  if (userFound){
    res.cookie("user_id", userName, { maxAge: 10 * 60 * 1000});
    res.redirect("/");
  } else {
    res.status(403);
    res.send("Error 403: Email and password do not match");
  }
});

app.get("/login", (req, res) => {
  let templateVars = {
    user: "",
    loginPage: true,
    registerPage: false
  };
  if (req.cookies["user_id"]) {
    templateVars.user = users[req.cookies["user_id"]];
  };
  res.render("login", templateVars);
});

app.get("/urls", (req, res) => { 
  let templateVars = {
    urls: urlDatabase,
    user: "",
    loginPage: false,
    registerPage: false
  };
  if (req.cookies["user_id"]) {
    templateVars.user = users[req.cookies["user_id"]];
  };
  res.render("urls_index", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post(`/urls/:shortURL/update`, (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect('/urls');
});

app.post(`/urls/:shortURL/delete`, (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  let newID = generateRandomString ();
  urlDatabase[newID] = {};
  urlDatabase[newID].longURL = req.body.longURL;
  urlDatabase[newID].user = req.cookies["user_id"];
  console.log(urlDatabase);
  res.redirect(`/urls/${newID}`);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: "",
    user_id: req.cookies["user_id"],
    loginPage: false,
    registerPage: false
  };
  if (req.cookies["user_id"]) {
    templateVars.user = users[req.cookies["user_id"]];
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { 
    shortURL: req.params.id,
    longURL: urlDatabase,
    user: "",
    user_id: req.cookies["user_id"],
    loginPage: false,
    registerPage: false
  };
  if (req.cookies["user_id"]) {
    templateVars.user = users[req.cookies["user_id"]];
  };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = {
    user: "",
    user_id: req.cookies["user_id"],
    loginPage: false,
    registerPage: true
  };
  if (req.cookies["user_id"]) {
    templateVars.user = users[req.cookies["user_id"]];
  };
  res.render("register", templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});

const generateRandomString = () => Math.random().toString(36).substr(2, 6);