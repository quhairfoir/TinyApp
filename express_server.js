const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 8000;

app.set('view engine', 'ejs');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

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
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
}

app.use(bodyParser.urlencoded({extended: true}));

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password){
    res.status(400);
    res.send("400: Email and password required!");
  } else {
  let newID = generateRandomString();
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[newID] = {};
  users[newID].id = newID;
  users[newID].email = req.body.email;
  users[newID].password = hashedPassword;
  req.session.user_id = newID;
  res.redirect("/urls");
  }
});

app.get("/", (req, res) => {
  if (req.session.user_id){
    res.redirect("/urls");
  }
  res.redirect("/login");
});

app.post("/login", (req, res) => {
  let userFound = false;
  let userName = "";
  for (let user in users) {
    if (users[user].email === req.body.email && bcrypt.compareSync(req.body.password, users[user].password)) {
      userFound = true;
      userName = users[user].id;
    }; 
  }
  if (userFound){
    req.session.user_id = userName;
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
  if (req.session.user_id) {
    templateVars.user = users[req.session.user_id];
  };
  res.render("login", templateVars);
});

app.get("/urls", (req, res) => { 
  let userFound = false;
  let templateVars = {
    urls: urlDatabase,
    user: "",
    loginPage: false,
    registerPage: false
  };
  if (req.session.user_id) {
    templateVars.user = users[req.session.user_id];
    userFound = true;
  };
  if (userFound){
    res.render("urls_index", templateVars);
  } else {
    res.status(401);
    res.send("Error 401: Must be signed in to see this page");
  }
});

app.post(`/urls/:shortURL/update`, (req, res) => {
  console.log("This is urlDatabase before update:", urlDatabase);
  let userFound = false;
  if (req.session.user_id === urlDatabase[req.params.shortURL].user){
    userFound = true;
  };
  if (userFound){
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    console.log("This is urlDatabase after update:", urlDatabase);
    res.redirect('/urls');
  } else {
    res.status(401);
    res.send("Error 401: Only the user who created this link can edit!");
  };
});

app.post(`/urls/:shortURL/delete`, (req, res) => {
  let userFound = false;
  if (req.session.user_id === urlDatabase[req.params.shortURL].user){
    userFound = true;
  };
  if (userFound){
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(401);
    res.send("Error 401: Only the user who created this link can delete!");
  };
});

app.post("/urls", (req, res) => {
  let newID = generateRandomString ();
  urlDatabase[newID] = {};
  urlDatabase[newID].longURL = req.body.longURL;
  urlDatabase[newID].user = req.session.user_id;
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: "",
    user_id: req.session.user_id,
    loginPage: false,
    registerPage: false
  };
  if (req.session.user_id) {
    templateVars.user = users[req.session.user_id];
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:id", (req, res) => {
  let userFound = false;
  let idFound = false;
  let match = false;
  let templateVars = { 
    shortURL: req.params.id,
    urls: urlDatabase,
    user: "",
    user_id: req.session.user_id,
    loginPage: false,
    registerPage: false
  };
  if (req.session.user_id) {  
    templateVars.user = users[req.session.user_id];
    userFound = true;
  };
  for (let shortID in urlDatabase) {
    if (req.params.id === shortID){
      idFound = true;
    }
  };
  if (idFound && userFound) {
    if (urlDatabase[req.params.id].user === req.session.user_id){
      match = true;
    }
  };
  console.log("This is idFound, userFound, match:", idFound, userFound, match)
  if (userFound && idFound && !match) {
    res.status(401);
    res.send("Error 401: you must sign in to see this page");
  } else if (idFound && userFound && match) {
    res.render("urls_show", templateVars);
  } else {
    res.status(404);
    res.send("Error 404: page not found");
  }
});



app.get("/register", (req, res) => {
  let templateVars = {
    user: "",
    user_id: req.session.user_id,
    loginPage: false,
    registerPage: true
  };
  if (req.session.user_id) {
    templateVars.user = users[req.session.user_id];
  };
  res.render("register", templateVars);
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  let link = urlDatabase[req.params.shortURL].longURL;
  res.redirect(link);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});

const generateRandomString = () => Math.random().toString(36).substr(2, 6);