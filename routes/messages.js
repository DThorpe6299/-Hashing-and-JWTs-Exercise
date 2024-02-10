const jwt = require("jsonwebtoken");
const Router = require("express").Router;
const router = new Router();

const User = require("../models/user");
const Message = require("../models/message")
const {SECRET_KEY} = require("../config");
const ExpressError = require("../expressError");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, ensureCorrectUser, async (req, res, next)=>{
    try{
        let message = await Message.get(req.params.id)
        return res.json({message})
    }catch(err){
        return next(err)
    }
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', ensureLoggedIn, async(req,res,next)=>{
    try{
        const { to_username, body } = req.body;
        const from_username = req.user.username;
        let message = Message.create(from_username, to_username, body)
        
        res.status(201).json({ message });
    }catch(err){
        return next(err);
    }
} )

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', ensureLoggedIn, async(req,res,next)=>{
    try{
        let message = await Message.get(req.params.id)
        if(!message){
            return res.status(404).json({error: "Message not found"})
        }
        if(req.user.username != message.to_username){
            return res.status(403).json({error: "You are not authorized to see this message"})
        }
        message.read_at = new Date();

        return res.status(200).json({ message });
        
    }catch(err){
        return next(err);
    }
})
module.exports=router;