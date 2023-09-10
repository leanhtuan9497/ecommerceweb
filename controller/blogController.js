const Blog = require('../models/blogModel');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const validateMongoDbId = require('../utils/validateMongodbId');
const cloudinaryUploadImg = require('../utils/cloudinary');
const fs = require('fs');
const createBlog = asyncHandler(async (req, res) => {
    try {
        const newBlog = await Blog.create(req.body);
        res.json({
            status: "succsess",
            newBlog,
        });
    } catch (error) {
        throw new Error(error);
    }
});

const updateBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const updatedBlog = await Blog.findByIdAndUpdate(id, req.body, {
            new: true,
        });
        res.json(updatedBlog);
    } catch (error) {
        throw new Error(error);
    }
});

const getBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const getedBlog = await Blog.findById(id).populate('likes').populate('dislikes');
        await Blog.findByIdAndUpdate(
            id,
            {
                $inc: { numViews: 1 },
            },
            { new: true }
        );
        res.json(getedBlog);
    } catch (error) {
        throw new Error(error);
    }
});

const getAllBlogs = asyncHandler(async (req, res) => {
    try {
        const getedAllBlogs = await Blog.find();
        res.json(getedAllBlogs);
    } catch (error) {
        throw new Error(error);
    }
});

const deleteBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const deletedBlog = await Blog.findByIdAndDelete(id);
        res.json(deleteBlog);
    } catch (error) {
        throw new Error(error);
    }
});

const likeBlog = asyncHandler(async (req, res) => {
    const { blogId } = req.body;
    validateMongoDbId(blogId);
    const blog = await Blog.findById(blogId);
    const loginUserId = req?.user?._id;
    const isLiked = blog?.isLiked;
    const alreadyDisliked = blog?.dislikes?.find(
        (userId) => userId?.toString() === loginUserId?.toString()
    );
    if (alreadyDisliked) {
        const blog = await Blog.findByIdAndUpdate(blogId, {
            $pull: { dislikes: loginUserId },
            isDisliked: false,
        },
            { new: true }
        );
    }

    if (isLiked) {
        const blog = await Blog.findByIdAndUpdate(blogId, {
            $pull: { likes: loginUserId },
            isLiked: false,
        },
            { new: true }
        );
        res.json(blog);
    } else {
        const blog = await Blog.findByIdAndUpdate(blogId, {
            $push: { likes: loginUserId },
            isLiked: true,
        },
            { new: true }
        );
        res.json(blog);
    }
});

const dislikeBlog = asyncHandler(async (req, res) => {
    const { blogId } = req.body;
    console.log(blogId);
    validateMongoDbId(blogId);
    const blog = await Blog.findById(blogId);
    const loginUserId = req?.user?._id;
    const isDisliked = blog?.isDisliked;
    console.log(loginUserId);
    const alreadyliked = blog?.likes?.find(
        (userId) => userId?.toString() === loginUserId?.toString()
    );
    console.log(alreadyliked);
    if (alreadyliked) {
        const blog = await Blog.findByIdAndUpdate(blogId, {
            $pull: { likes: loginUserId },
            isLiked: false,
        },
            { new: true }
        );
    }

    if (isDisliked) {
        const blog = await Blog.findByIdAndUpdate(blogId, {
            $pull: { dislikes: loginUserId },
            isDisliked: false,
        },
            { new: true }
        );
        res.json(blog);
    } else {
        const blog = await Blog.findByIdAndUpdate(blogId, {
            $push: { dislikes: loginUserId },
            isDisliked: true,
        },
            { new: true }
        );
        res.json(blog);
    }
});

const uploadImages = asyncHandler(async (req, res) => {
    const {id} = req.params;
    validateMongoDbId(id);
    try {
        const uploader = (path) => cloudinaryUploadImg(path,'images');
        const urls = [];
        const files = req.files;
        for(const file of files){
            const {path} = file;
            const newPath = await uploader(path);
            urls.push(newPath);
            fs.unlinkSync(path);
        }
        const findBlog = await Blog.findByIdAndUpdate(id,{
            images:urls.map((file) => {
                return file;
            }),
        },{
            new:true,
        });
        res.json(findBlog)
    } catch (error) {
        throw new Error(error);
    }
});

module.exports = { createBlog, updateBlog, getBlog, getAllBlogs, deleteBlog, likeBlog, dislikeBlog,uploadImages };