import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import z from "zod";
import jsonwebtoken from "jsonwebtoken";
import { contentModel, userModel } from "./db";
import { authMiddleware } from "./middleware";
import { jwtsecretkey } from "./config";
const app = express();

app.use(express.json());

function requiredBody(data:{
    username:string,
    password:string
}):boolean{
    const requiredBody=z.object({
        username:z.string().min(8).max(10),
        password:z.string().regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
      )
    })
    const validData=requiredBody.safeParse(data);
    return validData.success
}


app.post("/api/v1/signup", async(req, res) => {
    const {username,password}=req.body;
    const success=requiredBody(req.body);

    if(!success){
        res.json({
            msg:"invalid format!"
        })
        return;
    }

    const hashed=await bcrypt.hash(password,5);
    try{
    const data=await userModel.create({
        username:username,
        password:hashed
    })

    console.log(hashed);

    res.json({
        msg:"Signed up successfully!"
    
    })
    }
    catch(e){
        res.status(403).json({
            msg:"Invalid login details!"
        })
    }

});

app.post("/api/v1/signin", async(req, res) => {
    const {username,password}=req.body;
    const user= await userModel.findOne({
        username:username
    })

    if(!user){
        res.json({
            msg:"User is not found!"
        })
        return;
    }
    const comparePassword= await bcrypt.compare(password,user.password);
    if(!comparePassword){
        res.send("password is incorrect!")
    }

    const token=jsonwebtoken.sign({id: user._id },jwtsecretkey);

    res.json({
        msg:"Signed in successfully!",
        token:token
    })
});

app.post("/api/v1/content",authMiddleware, async(req, res) => {

    const {link,title,tags}=req.body;
    //@ts-ignore
    const userid=req.userid;

    console.log(userid);
    const content=await contentModel.create({
        link:link,
        title:title,
        tags:[],
        //@ts-ignore
        userId:req.userid
    })
    res.json({
        msg:"Content added!"
    })

});

app.get("/api/v1/content",authMiddleware,async (req, res) => {
    //@ts-ignore
    const userid=req.userid;

    const content=await contentModel.find({
        userId:userid
    }).populate("userId","username")
    res.json({
        content
    })
});

app.delete("/api/v1/content",authMiddleware, async(req, res) => {
    const contentid=req.body.contentid;

    await contentModel.deleteMany({
        _id:contentid,
        //@ts-ignore
        userId:req.userid
    })

    res.json({
        msg:"Deleted successfully!"
    })

});

app.post("/api/v1/brain/share", (req, res) => {});

app.get("/api/v1/brain/:shareLink", (req, res) => {});

async function run(){
app.listen(3000, () => {
  console.log("listening on port 3000");
});
await mongoose.connect("mongodb+srv://saivardhannp:saivardhan11@mydatabase.vzet070.mongodb.net/second-brain")

}

run();
