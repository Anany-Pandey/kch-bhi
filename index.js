const http=require('http');
const fs= require('fs').promises;
const ws= require("ws");
const security=require("./backend/security.js");
const bcrypt = require("bcrypt");
const port=3000;

async function dlt(){
    await fs.writeFile("users.txt","{}");
}
dlt();
delete dlt;

async function load(s,encoding){
if(!encoding)
return fs.readFile(s);
else
return fs.readFile(s,encoding);
}
function parse(s){
s=s.substring(1,s.length);
return s.split("/");
}
function contains(obj,key){
    for(let i in obj){
        if(i==key)
        return true;
    }
    return false;
}

async function createAccount(username, password) {
    password=await bcrypt.hash(password,10);
    try {
        const users = JSON.parse(await load("users.txt","utf-8"));
        if (!users[username]) {
            users[username] = { pass: password, data: { msgs: {} } };
            await fs.writeFile("users.txt", JSON.stringify(users, null, 2));
            return true; // Account created successfully
        } else {
            return false; // Username already exists
        }
    } catch (error) {
        console.error("Error creating account:", error);
        return false;
    }
}

async function authenticate(username, password) {
    try {
        const users = JSON.parse(await load("users.txt","utf-8"));
        return users[username] && await bcrypt.compare(password,users[username].pass);
    } catch (error) {
        console.error("Error authenticating:", error);
        return false;
    }
}
async function getmsgs(usr){
    let obj = JSON.parse(await load("users.txt","utf-8"));
    return obj[usr].data.msgs;
}
const server=http.createServer(async (req,res)=>{
let request=parse(req.url);
if(req.url=="/"){
    res.writeHead(200,{"content-type":"text/html"});
    res.write(await load("frontend/login.html","utf-8"));
    res.end();
}
else if(req.url=="/signup.html"){
    res.writeHead(200,{"content-type":"text/html"});
    res.write(await load("frontend/signup.html","utf-8"));
    res.end();
}
else if(request[0]=="Create"){
    if(contains(JSON.parse(await load("users.txt","utf-8")),request[1])){
        res.writeHead(200,{"Content-Type":"text/plain"});
        res.write("Username is already taken");
        res.end();
    }
    else if(request[1]=="" || request[2]==""){
        res.writeHead(200,{"Content-Type":"text/plain"});
        res.write("Password OR Username Cannot Be Empty.".toUpperCase());
        res.end();
    }
    else{
        createAccount(request[1],request[2]);
        res.writeHead(200,{"Content-Type":"text/plain"});
        res.write("Created");
        res.end();
    }
}
else if(request.length>=3 && await authenticate(request[0],request[1])){
    if(request[2]==""){
        res.writeHead(200,{"content-type":"text/html"});
        res.write(await load("frontend/main_menu.html"));
        res.end();
    }
    else if(request[2]=="msgs"){
        res.writeHead(200,{"content-type":"text/html"});
        res.write(await load("frontend/msg.html"));
        res.end();
    }
    else if(request[2]=="send.svg"){
        res.writeHead(200,{"content-type":"image/svg+xml"});
        res.write(await load("send.svg"));
        res.end();
    }
    else if(request[2]=="verify"){
        res.writeHead(200,{"content-type":"text/plain"});
        res.write("Ok");
        res.end();
    }
    else{
        res.writeHead(404,{"content-type":"text/plain"});
        res.write("Content Not Found");
        res.end();
    }
}
else if(request.length>=3 && !(await authenticate(request[0],request[1]))){
    if(request[2]=="verify"){
        res.writeHead(200,{"content-type":"text/plain"});
        res.write("Either Password Or Username is Wrong");
        res.end();
        return;
    }
    else{
        res.writeHead(200,{"content-type":"text/html"});
        res.write(await load("frontend/redirect.html","utf-8"));
        res.end();
        }
}
else{
    res.writeHead(404,{"content-type":"text/plain"});
    res.write("Content Not Found");
    res.end();
}
}
);
const socket=new ws.Server({server:server});
const UserConnected={};
socket.on("connection",async(user,req)=>{
    let request=parse(req.url);
    if(!await authenticate(request[0],request[1])){user.close();return;}
    let obj=JSON.parse((await load("users.txt","utf-8")));
    let usr=request[0];
    user.send(JSON.stringify(obj[usr]["data"]["msgs"]));
    UserConnected[usr]=user;
    user.on("message",async (data)=>{
        data=data.toString();
        data=data.split("%#");
        let obj=JSON.parse((await load("users.txt","utf-8")));
        if(data.length==1){
            user.send(""+contains(obj,data[0]));
            return;
        }
        data[0]=data[0].replace(/ /g, "%20");
        data[1]=security.sanitize(data[1]);
        let format='<p class="a">data</p>';
        if(obj[usr]["data"]["msgs"][data[0]]==undefined){
            obj[usr]["data"]["msgs"][data[0]]=format.replace("data",data[1]);
        }
        else{
            obj[usr]["data"]["msgs"][data[0]]+=format.replace("data",data[1]);
        }
        if(obj[data[0]]["data"]["msgs"][usr]==undefined){
            obj[data[0]]["data"]["msgs"][usr]='<p class="b">data</p>'.replace("data",data[1]);
        }
        else{
            obj[data[0]]["data"]["msgs"][usr]+='<p class="b">data</p>'.replace("data",data[1]);
        }
        user.send(JSON.stringify(obj[usr]["data"]["msgs"]));
        UserConnected[data[0]]?.send(JSON.stringify(obj[data[0]]["data"]["msgs"]))
        fs.writeFile("users.txt",JSON.stringify(obj,null,2));
    });
    user.on("close",()=>{
        delete UserConnected[user];
    });
}
);
server.listen(port);
