import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { jwtsecretkey } from "./config";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers["token"];

  const verify = jwt.verify(token as string, jwtsecretkey);
  console.log(verify);

  if (verify) {
    // @ts-ignore
    req.userid = verify.id;
    next();
  } else {
    res.json({
      msg: "you are not logged in!",
    });
    return;
  }
};
