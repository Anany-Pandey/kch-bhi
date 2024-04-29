const http= require('http');
const fs= require('fs').promises;
const ws= require("ws");
const port=3000;

async function load(s,encoding){
if(!encoding)
return fs.readFile(s);
else
return fs.readFile(s,encoding);
}
function parse(s){
s=s.substring(1,s.length);
s.split("/");
return s.split("/");
}
function contains(obj,key){
    for(let i in obj){
        if(i==key)
        return true;
    }
    return false;
}
async function createAccount(usr,pass){
    let obj=JSON.parse(await load("users.txt","utf-8"));
    if(!contains(obj,usr)){
        obj[usr]={pass:pass,data:{contacts:"",msgs:{}}}
        await fs.writeFile("users.txt", JSON.stringify(obj, null, 2));
    }
    else{
        return false;
    }
}
async function authenticate(usr,pass){
    let obj=JSON.parse(await load("users.txt","utf-8"));
    try{
        if(obj[usr].pass==pass){
            return true;
        }
        else {
            return false;
        }
    }
    catch{
        return false;
    }
}
function getcontacts(usr){

}
const server=http.createServer(async (req,res)=>{
let request=parse(req.url);
console.log(req.url);
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
else if(req.url=="/auth.jpg"){
    res.writeHead(200,{"content-type":"image/jpg"});
    res.write(await load("frontend/auth.jpg"));
    res.end();
}
else if(request[0]=="Create"){
    if(contains(JSON.parse(await load("users.txt","utf-8")),request[1])){
        res.writeHead(200,{"Content-Type":"text/plain"});
        res.write("Username is already taken");
    }
    else{
        createAccount(,request[1],,request[2]);
        res.writeHead(200,{"Content-Type":"text/plain"});
        res.write("Created");
    }
}
else if(request.length>=3 && await authenticate(request[0],request[1])){
    if(request[3]==""){
        res.writeHead(200,{"content-type":"text/html"});
        res.write(await load("frontend/main_menu.html"));
        res.end();
    }
    else if(request[3]=="msgs"){
        res.writeHead(200,{"content-type":"text/html"});
        res.write(await load("frontend/msg.html"));
        res.end();
    }
    else{
        res.writeHead(404,{"content-type":"text/plain"});
        res.write("Content Not Found");
        res.end();
    }
}
else if(request.length>=3 && !await authenticate(request[0],request[1])){
    res.writeHead(200,{"content-type":"text/html"});
    res.write(await load("frontend/redirect.html","utf-8"));
    res.end();
}
else{
    res.writeHead(404,{"content-type":"text/plain"});
    res.write("Content Not Found");
    res.end();
}
}
);

const socket=ws.Server({Server:server});
socket.on("connection",async (user)=>{
    let usr;
    user.on("message"),(data)=>{
        data=data.split('/');
        if(!authenticate(data[0],data[1]))
        user.close();
        usr=[data[0]];
    };
    user.on("message",(data)=>{
        JSON.parse(await load("user.txt","utf-8"))
    });

});

server.listen(port);