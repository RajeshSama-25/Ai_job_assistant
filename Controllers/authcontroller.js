// ==========================================
// Authentication Controller
// controllers/authController.js
// ==========================================

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import {
    createUser,
    findUserByEmail,
    findUserById
} from "../models/User.js";


// ==========================================
// Generate JWT Token
// ==========================================

const generateToken = (id) => {

    return jwt.sign(

        {
            id
        },

        process.env.JWT_SECRET,

        {
            expiresIn: "7d"
        }

    );

};


// ==========================================
// Register User
// POST /api/auth/register
// ==========================================

export const register = async(req,res)=>{

    try{

        const {
            full_name,
            email,
            password
        } = req.body;


        // Validation

        if(!full_name || !email || !password){

            return res.status(400).json({

                success:false,

                message:"All fields are required"

            });

        }


        // Check existing user

        const existingUser =
            await findUserByEmail(email);


        if(existingUser){

            return res.status(400).json({

                success:false,

                message:"Email already registered"

            });

        }


        // Hash password

        const hashedPassword =
            await bcrypt.hash(password,10);



        // Create User

        const user =
            await createUser(

                full_name,

                email,

                hashedPassword

            );


        const token =
            generateToken(user.id);



        res.status(201).json({

            success:true,

            message:"Registration successful",

            user,

            token

        });



    }
    catch(error){

        console.error(error);


        res.status(500).json({

            success:false,

            message:"Registration failed"

        });

    }

};



// ==========================================
// Login User
// POST /api/auth/login
// ==========================================

export const login = async(req,res)=>{


    try{


        const {

            email,

            password

        } = req.body;



        const user =
            await findUserByEmail(email);



        if(!user){

            return res.status(401).json({

                success:false,

                message:"Invalid email or password"

            });

        }



        const passwordMatch =
            await bcrypt.compare(

                password,

                user.password

            );



        if(!passwordMatch){

            return res.status(401).json({

                success:false,

                message:"Invalid email or password"

            });

        }



        const token =
            generateToken(user.id);



        res.json({

            success:true,

            message:"Login successful",

            user:{

                id:user.id,

                name:user.full_name,

                email:user.email

            },

            token

        });



    }

    catch(error){


        console.error(error);


        res.status(500).json({

            success:false,

            message:"Login failed"

        });


    }


};



// ==========================================
// Get Current User
// GET /api/auth/me
// ==========================================

export const getMe = async(req,res)=>{


    try{


        const user =
            await findUserById(req.user.id);



        res.json({

            success:true,

            user

        });


    }

    catch(error){


        res.status(500).json({

            success:false,

            message:"Unable to get user"

        });


    }


};