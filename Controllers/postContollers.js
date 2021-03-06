const User = require("../Models/userSchema")
const Post = require("../Models/postSchema")
const cloudinary = require('../Helpers/cloudinary')

// =================Function to Create Post==========================
const createPost = async (req, res) => {
    try {
        const postImg = req.file
        const description = req.body;
        if(!description){
            return res.status(400).json("one or more fields required")
        }

        const creator = await User.findById(req.params.userId)

        let postDetails = {}
        if(postImg){
            const result = await cloudinary.uploader.upload(postImg.path)

            postDetails = {
                creator : creator._id,
                postImg : result.secure_url,
                ...description
            }
        }else{
            postDetails = {
                creator : creator._id,
                ...description
            }
        }
        
        const post = new Post({
            creator,
            ...postDetails
        })
        await post.save();
        
        creator.postCount += 1;
        const newDetails = await creator.save()

        res.status(200).json({msg : "success", resp : newDetails});
    } catch (err) {
        console.log(err);
        res.status(400).json({msg : "Process Failed"})
    }

}

// ==========Function to Comment on Post ============================
const Comment = async (req, res) => {
    try {
        const comment = req.body.comment;

        if(!comment){
            return res.status(400).json("comment is required")
        }

        const post = await Post.findById(req.params.postid)
        const commentBy = req.params.commentorid;

        post.comments.push({
            comment,
            commentBy
        })
        await post.save()
        //  type msg in resp
        res.status(200).json("scuccess");
    } catch (err) {
        console.log(err);
        res.status(200).json("process failed");

    }

}

// ===============Function to Like a post ===========================

const LikePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postid)
        const likerExists = post.likes.likedBy.includes(req.params.likerid)
        
        if(likerExists){
            post.likes.likeCount -= 1
            const indexOfLiker = post.likes.likedBy.indexOf(req.params.likerid)
            post.likes.likedBy.splice(indexOfLiker, 1)

        }else{
            post.likes.likeCount += 1
            post.likes.likedBy.push(req.params.likerid)
        }

        await post.save()
        res.status(200).json("success");
    } catch (err) {
        console.log(err);
        res.status(400).json("Procees Failed")
    }

}

// ==========Function to get all  Posts of a particular user ============================
const fetchUserPosts = async (req, res) =>{
    try{
        const userPosts = await Post.find({creator : req.params.userid}).populate("creator", "name profileImg").sort({"date" : "desc"})
        res.status(200).json(userPosts)
    }catch(err){
        console.log(err)
        res.status(400).json("Process failed")
    }

}

// ==========Function to get single  Post of a particular user ============================

const fetchSinglePost =async (req, res) =>{
    try{
        const singlePost = await Post.findById(req.params.postId)
                                                        .populate("creator", "name profileImg")
                                                        .populate({path : 'comments.commentBy', select : "name profileImg"})
        
        res.status(200).json(singlePost)
    }catch(err){
        console.log(err)
        res.status(400).json("Process failed")
    }
}
// ==========Function to get all  Post ============================

const fetchAllPosts = async (req, res) =>{
    try{
        const userId = req.body.userId
        const allPosts = await Post.find({"creator" : {$ne : userId}}).populate("creator", "name profileImg").sort({"date" : "desc"})
        res.status(200).json(allPosts)
    }catch(err){
        console.log(err)
        res.status(400).json("Process failed")
    }

}


module.exports = { createPost, Comment, LikePost, fetchUserPosts, fetchAllPosts, fetchSinglePost }