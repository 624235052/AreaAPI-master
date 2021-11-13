var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var fileUpload = require('express-fileupload');
const dotenv = require('dotenv');
dotenv.config();
var apiversion='/api/v1';
var Areapicturepath=process.env.IMAGE_PATH;
const secretkey=process.env.SECRET

//MYSQL Connection
var db = require('./config/db.config');
const bcrypt = require('bcryptjs');
const {sign,verify}  = require('./middleware.js');

var port = process.env.PORT || 3000;
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(fileUpload());


//Add new post
app.post(apiversion + '/area',  function (req, res) {
  try {
  var areaName = req.body.areaName;
  var areaPosition = req.body.areaPosition;
  var areaSize = req.body.areaSize;
  var areaPicture = req.body.areaPicture;

  res.setHeader('Content-Type', 'application/json');
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  db.query(`INSERT INTO area 
    (areaName,areaPosition,areaSize,areaPicture) 
    VALUES ('${areaName}', '${areaPosition}', ${areaSize}, '${areaPicture}');`,function (error, results, fields) {
      if (error) throw error;
      return res.send({ error: false, message: 'Insert new area' });
  });
}catch{
  return res.status(401).send()
}

});

//Upload
app.post(apiversion + '/upload', (req, res) => {
 
  
  if (!req.files) {
      return res.status(500).send({ msg: "file is not found" })
  }

  const myFile = req.files.file;
 
  myFile.mv(`${Areapicturepath}${myFile.name}`, function (err) {
   
      if (err) {
          console.log(err)
          return res.status(500).send({ msg: "Error occured" });
      }
     
      return res.send({name: myFile.name, path: `/${myFile.name}`});

  });


});




//API ลงชื่อเข้าใช้งาน
app.post(apiversion + '/auth/signin', (req, res) => {

  db.query('SELECT * FROM users where username=?',req.body.username, function (error, results, fields) {

    try
    {
      if (error) {

        throw error;

      }else{

      
        let hashedPassword=results[0].password
        const correct =bcrypt.compareSync(req.body.password, hashedPassword)

        if (correct)
        {
          let user={
            username: req.body.username,
            role: results.role,
            password: hashedPassword,
          }

          // create a token
          let token = sign(user, secretkey);
          
          res.setHeader('Content-Type', 'application/json');
          res.header("Access-Control-Allow-Origin", "*");
          res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

          return res.status(201).send({ error: false, message: 'user sigin', accessToken: token });

        }else {

          return res.status(401).send("login fail")

        }

      }

    }
    catch(e)
    {
      return res.status(401).send("login fail")
    }
    
  });

});

//API ลงทะเบียนเพื่อรับ Token
app.post(apiversion + '/auth/register', (req, res) => {

  const hashedPassword = bcrypt.hashSync(req.body.password,10);

  let user={
      username: req.body.username,
      role: req.body.role,
      password: hashedPassword,
  }

  res.setHeader('Content-Type', 'application/json');
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");


  try {

    db.query(`INSERT INTO users 
      (username,password,role) 
      VALUES ( '${user.username}','${hashedPassword}','${user.role}');`,function (error, results, fields) {
        if (error) throw error;
        return res.status(201).send({ error: false, message: 'created a user' })  
    });

 }
 catch(err) 
 {

   return res.send(err)
   
 }

});




app.listen(port, function () {
    console.log("Server is up and running...");
});








