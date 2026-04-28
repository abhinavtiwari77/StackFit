const userModel = require('../models/user.model');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const tokenBlacklistModel = require('../models/blacklist.model')

/**
 * @name registerUserController
 * @desc Controller to handle user registration
 * @route POST /api/auth/register
 * @access Public
 * @body { username, email, password }
 */

async function registerUserController(req,res){
    try {
        const {username,email,password} = req.body;

        if(!username || !email || !password){
            return res.status(400).json({
                message:'All fields are required'
            })
        }

        const isUserAlreadyExist = await userModel.findOne({
            $or:[{username},{email}]
        })

        if(isUserAlreadyExist){
            return res.status(400).json({
                message:'User already exists'
            })
        }

        const hash = await bcryptjs.hash(password,10);

        const newUser = await userModel.create({
            username,email,password:hash
        })

        const token = jwt.sign(
            {id:newUser._id},
            process.env.JWT_SECRET_KEY,
            {expiresIn:'1d'}
        );

        res.cookie("token",token,{
            httpOnly:true
        })

        res.status(201).json({
            message:'User registered successfully',
            user:{
                id:newUser._id,
                username:newUser.username,
                email:newUser.email
            }
        })

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message:"Internal Server Error",
            error:err.message
        })
    }
}

/**
 * @name loginUserController
 * @desc Controller to handle user login
 * @route POST /api/auth/login
 * @access Public
 * @body { email, password }
 */

async function loginUserController(req,res){
    try {
        const {email,password} = req.body;

        if(!email || !password){
            return res.status(400).json({
                message:'All fields are required'
            })
        }

        const user = await userModel.findOne({
            email:email
        })

        if(!user){
            return res.status(400).json({
                message:"Invalid credentials"
            })
        }
        const isPasswordValid = await bcryptjs.compare(password,user.password)

        if(!isPasswordValid){
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        const token = jwt.sign(
            {id:user._id,username:user.username},
            process.env.JWT_SECRET_KEY,
            {expiresIn:"1d"}    
        )

        res.cookie("token",token,{
            httpOnly:true
        })

        res.status(200).json({
            message:"User logged in successfully",
            user:{
                id:user._id,
                username:user.username,
                email:user.email
            }
        })

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message:"Internal Server Error",
            error:err.message
        })
    }
}

/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
async function logoutUserController(req,res){
    try {
        const token = req.cookies.token

        if(token){
            await tokenBlacklistModel.create({token})
        }

        res.clearCookie("token")

        res.status(200).json({
            message:"User logged out successfully"
        })

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

/**
 * @name getMeController
 * @description get the current logged in user details
 * @access private
 */
async function getMeController(req,res){
    try {
        const user = await userModel.findById(req.user.id)

        res.status(200).json({
            message:"user details fetched successfully",
            user:{
                id:user._id,
                username:user.username,
                email:user.email
            }
        })

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}