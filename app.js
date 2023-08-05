const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const bcrypt = require("bcrypt");

const app = express();

app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const validDate = (password) => {
  return password.length > 4;
};

// register
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const selectUserQuery = `
  SELECT 
    * 
  FROM 
    user 
  WHERE 
    username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);

  //new/existing user
  if (dbUser === undefined) {
    //create user
    const createUserQuery = `
    INSERT INTO
       user (username, name, password, gender, location)
      VALUES
      (
      '${username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}'  
       );`;
    if (validDate(password)) {
      await db.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//login
app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const selectUserQuery = `
  SELECT 
    * 
  FROM 
    user 
  WHERE 
    username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);

  //new/existing user
  if (dbUser === undefined) {
    //create user

    response.status(400);
    response.send("Invalid user");
  } else {
    const isPassword = await bcrypt.compare(password, dbUser.password);

    if (isPassword === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//change-password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const UpdateQuery = `
    SELECT * FROM user
    WHERE 
    username = '${username}';`;
  const dbUser = await db.get(UpdateQuery);
  //new/existing user
  if (dbUser === undefined) {
    //create user

    response.status(400);
    response.send("Invalid user");
  } else {
    const isPassword = await bcrypt.compare(oldPassword, dbUser.password);

    if (isPassword === true) {
      if (validDate(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const ss = `
           UPDATE
           user
           SET
           password ='${hashedPassword}'
           WHERE
           username= '${username}';`;

        const user = await db.run(ss);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
