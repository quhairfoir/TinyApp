const express = require("express");
const bodyParser = require("body-parser");
const cookies = require("cookie-parser");
const app = express();
const PORT = 8000;

app.set('view engine', 'ejs');
app.use(cookies());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
    console.log(res);
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
})

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => { 
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
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
  urlDatabase[newID] = req.body.longURL;
  res.redirect(`/urls/${newID}`);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
    longURL: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };
  res.render("register", templateVars);
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});

const generateRandomString = () => Math.random().toString(36).substr(2, 6);