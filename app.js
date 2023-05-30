const express = require("express");
const app = express();

const {open} = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

const bcrypt = require("bcrypt");

let db=null;
//initialization
const initializeDbAndServer = async ()=>{
    try{
        db = await open({
            filename : dbPath,
            driver : sqlite3.Database,
        });
        app.listen(3000), ()=>
        console.log("Server is Running");
    } catch(e){
        console.log(`DB Error: ${e.message}`);
        process.exit(1);
    }
}
initializeDbAndServer();


//Register
app.post("/register",async (request, response)=>{

    let {username, name, password, gender, location } = request.body;
    let hashPassword = await bcrypt.hash(password, 10);
    let checkUsername= `SELECT * FROM user WHERE username = "${username}";`;
    let checked = await db.get(checkUsername);
    
    if(checked === undefined){
        let createUserQuery = `INSERT INTO user (username, name, password, gender, location)
        VALUES ("${username}", "${name}", "${hashPassword}", "${gender}", "${location}");`;
        if (password.length <5){
            response.status(400);
            response.send("Password is too short");
        } else{
            let newUserDetails = await db.run(createUserQuery);
            response.status(200);
            response.send("User created successfully");
        }
    } else{
        response.status(400);
        response.send("User already exist");
    }
});

//login
app.post("/login",async (request, response)=>{
    const {username, password} = request.body;
    const checkUsername = `SELECT * FROM user WHERE username = "${username}";`;
    const dbUser = await db.get(checkUsername);
    if (dbUser=== undefined){
        response.status(400);
        response.send("Invalid User");
    } else{
        const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
        if (isPasswordMatched){
            response.status(200);
            response.send("Login Success!");
        } else{
            response.status(400);
            response.send("Invalid Password");
        }
    }
});


//Change Password
app.put("/change-password", async (request, response)=>{
    const {username, oldPassword, newPassword} = request.body;
    const checkUsername = `SELECT * FROM user WHERE username = "${username}";`;
    const dbUser = await db.get(checkUsername);
    if (dbUser === undefined){
        response.status(400);
        response.send("User not registered");
    } else{
        const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
        if (isPasswordMatched){
            const length = newPassword.length;
            if (length>5){
                const hashNewPassword = await bcrypt.hash(newPassword, 10);
                const changePasswordQuery = `UPDATE user 
                SET password = "${hashNewPassword}" WHERE username = "${username}";`;
                await db.run(changePasswordQuery);
                response.status(200);
                response.send("Password updated");
            } else{
                response.status(400);
                response.send("Password is too short");
            }
        } else{
            response.status(400);
            response.send("Invalid Current Password");
        }
    }
});

module.exports = app;