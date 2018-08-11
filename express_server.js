const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const methodOverride = require("method-override");

const app = express();
const PORT = 8000;

app.set("view engine", "ejs");

app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ["key1", "key2"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const getUsersURLs = function(user_id) {
  let idObj = {};
  for (let shortURL in urlDatabase){
    if (urlDatabase[shortURL].user === user_id){
      idObj[shortURL] = urlDatabase[shortURL];
    }
  }
  return idObj;
};

const getCurrentDate = function() {
  let today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth()+1;
  const yyyy = today.getFullYear();
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  today = mm + "/" + dd + "/" + yyyy;
  return today;
}

const urlDatabase = {
  "b2xVn2": { 
    longURL: "http://www.lighthouselabs.ca",
    user: "userRandomID",
    visitCount: 2,
    dateCreated: "08/01/2018"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    user: "user2RandomID",
    visitCount: 6,
    dateCreated: "07/31/2018"
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

//validates for AND 
const andValidate = function (condition1, condition2) {
  if (condition1 && condition2) {
    return true;
  }
  return false;
}

const findInUsers = function (key, value) {
  for (let user in users){
    if (users[user][key] === value){
      return true;
    }
  }
  return false;
}

app.post("/register", (req, res) => {
  let userExists = findInUsers("email", req.body.email);
  let acceptableInput = andValidate(req.body.email, req.body.password);
  if (!acceptableInput) {
    res.status(400);
    res.send("400: Fields must be filled in.");
  } else if (userExists) {
    res.status(409);
    res.send("409: Email address already has user account.");
  } else {
    let newID = generateRandomString();
    users[newID] = {
      id: newID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
    };
    req.session.user_id = newID;
    res.redirect("/urls");
  } 
});

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
  res.redirect("/login");
  }
});

app.post("/login", (req, res) => {
  let userFound = false;
  let userName = "";
  for (let user in users) {
    if (users[user].email === req.body.email && bcrypt.compareSync(req.body.password, users[user].password)) {
      userFound = true;
      userName = users[user].id;
    }
  }
  if (userFound) {
    req.session.user_id = userName;
    res.redirect("/");
  } else {
    res.status(403);
    res.send("Error 403: Invalid email and/or password");
  }
});

app.get("/login", (req, res) => {
  let templateVars = {
    user: "",
    loginPage: true,
    registerPage: false
  };
  res.render("login", templateVars);
});

app.get("/urls", (req, res) => { 
  let userFound = false;
  let templateVars = {
    urls: getUsersURLs(req.session.user_id),
    user: "",
    loginPage: false,
    registerPage: false
  };
  if (req.session.user_id) {
    templateVars.user = users[req.session.user_id];
    userFound = true;
  };
  if (userFound) {
    res.render("urls_index", templateVars);
  } else {
    res.status(401);
    res.send("Error 401: Must be signed in to see this page");
  }
});

// only the user who created a link has access to that link's page
app.put(`/urls/:shortURL`, (req, res) => {
  let userMatch = false;
  if (req.session.user_id === urlDatabase[req.params.shortURL].user) { 
    userMatch = true;
  };
  if (userMatch){
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect('/urls');
  } else {
    res.status(401);
    res.send("Error 401: Only the user who created this link can edit!");
  }
});

app.delete(`/urls/:shortURL`, (req, res) => {
  let userFound = false;
  if (req.session.user_id === urlDatabase[req.params.shortURL].user) {
    userFound = true;
  };
  if (userFound){
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(401);
    res.send("Error 401: Only the user who created this link can delete!");
  }
});

app.post("/urls", (req, res) => {
  let newID = generateRandomString ();
  urlDatabase[newID] = {
    longURL: req.body.longURL,
    user: req.session.user_id,
    visitCount: 0,
    uniqueVisitCount: 0,
    dateCreated: getCurrentDate()
  };
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
    urls: getUsersURLs(req.session.user_id),
    user: "",
    user_id: req.session.user_id,
    loginPage: false,
    registerPage: false
  }
  // find presence of authenticated user
  if (req.session.user_id) {  
    templateVars.user = users[req.session.user_id];
      if ()
    userFound = true;
  }
  // find presence of shortURL entry
  for (let shortID in urlDatabase) {
    if (req.params.id === shortID) {
      idFound = true;
    }
  }
  // check if user owns shortURL
  if (idFound && userFound) {
    if (urlDatabase[req.params.id].user === req.session.user_id){
      match = true;
    }
  }
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
    loginPage: false,
    registerPage: true
  };
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
  res.render("register", templateVars);
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.get("/u/:shortURL", (req, res) => {
  let shortURLFound = false;
  for (let id in urlDatabase) {
    if (req.params.shortURL === id) {
      shortURLFound = true;
      urlDatabase[id].visitCount++;
    }
  }
  if (shortURLFound) {
    if (urlDatabase[req.params.shortURL].longURL){
    let link = urlDatabase[req.params.shortURL].longURL;
    res.redirect(link);
    } else {
      res.status(404);
      res.send("Error 404: page not found");
    }
  } else {
    res.status(404);
    res.send("Error 404: page not found");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});

const generateRandomString = () => Math.random().toString(36).substr(2, 6);