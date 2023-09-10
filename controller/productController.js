const Product = require('../models/productModel');
const User = require('../models/userModel')
const asyncHandler = require('express-async-handler');
const slugify = require('slugify');
const validateMongoDBId = require('../utils/validateMongodbId');
const {cloudinaryUploadImg,cloudinaryDeleteImg} = require('../utils/cloudinary');
const fs = require('fs');

const createProduct = asyncHandler(async (req, res) => {
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        }
        const newProduct = await Product.create(req.body);
        res.json(newProduct);
    } catch (error) {
        throw new Error(error);
    }
})

const updateProduct = asyncHandler(async (req, res) => {
    const { _id } = req.params;
    validateMongoDBId(id);
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        }
        console.log(req.body)
        const updateProduct = await Product.findOneAndUpdate(_id, req.body, { new: true });
        console.log(updateProduct)
        res.json(updateProduct);
    } catch (error) {
        throw new Error(error)
    }
})

const deleteProduct = asyncHandler(async (req, res) => {
    const { _id } = req.params;
    validateMongoDBId(id);
    try {
        const deleteProduct = await Product.findOneAndDelete(_id);
        res.json(deleteProduct);
    } catch (error) {
        throw new Error(error)
    }
})

const getaProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDBId(id);
    try {
        const findProduct = await Product.findById(id);
        res.json(findProduct);
    } catch (error) {
        throw new Error(error)
    }
})

const getAllProduct = asyncHandler(async (req, res) => {
    try {
        //Filter
        const queryObj = { ...req.query };
        const excludeFields = ["page", "sort", "limit", "fields"];
        excludeFields.forEach((el) => { delete queryObj[el] });
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
        let query = Product.find(JSON.parse(queryStr));
        // const getAllProducts = await Product.where("category").equals(
        //     req.query.category
        // );

        //Sorting
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy)
        } else {
            query = query.sort('-createdAt');
        }

        //Limiting the fields
        if (req.query.fields) {
            const fields = req.query.fields.split(',').join(' ');
            query = query.select(fields);
        } else {
            query = query.select('-__v');
        }

        //Panigation
        const page = req.query.page;
        const limit = req.query.limit;
        const skip = (page - 1) * limit;
        query = query.skip(skip).limit(limit);
        if (req.query.page) {
            const productCount = await Product.countDocuments();
            if (skip >= productCount) throw new Error('This page is not exists');
        }
        const product = await query;
        res.json(product);
    } catch (error) {
        throw new Error(error);
    }
});

const addToWishList = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { prodId } = req.body;
    try {
        const user = await User.findById(_id);
        const alreadyAdded = user.wishlist.find((id) => id.toString() == prodId);
        if (alreadyAdded) {
            let user = await User.findByIdAndUpdate(_id, {
                $pull: { wishlist: prodId }
            }, {
                new: true,
            });
            res.json(user);
        } else {
            let user = await User.findByIdAndUpdate(_id, {
                $push: { wishlist: prodId }
            }, {
                new: true,
            });
            res.json(user);
        }
    } catch (error) {
        throw new Error(error);
    }
});

const rating = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { star, prodId, comment } = req.body;
    try {
        const product = await Product.findById(prodId);
        let alreadyRated = product.ratings.find((userId) => userId.postedby.toString() == _id.toString());
        if (alreadyRated) {
            const updateRating = await Product.updateOne({
                ratings: { $elemMatch: alreadyRated }
            }, {
                $set: { "ratings.$.star": star, "ratings.$.comment": comment }
            }, {
                new: true
            });
            res.json(updateRating);
        } else {
            const rateProduct = await Product.findByIdAndUpdate(
                prodId,
                {
                    $push: {
                        ratings: {
                            star: star,
                            comment: comment,
                            postedby: _id,
                        },
                    },
                },
                {
                    new: true,
                }
            );

            const getAllRatings = await Product.findById(prodId);
            let totalRating = getAllRatings.ratings.length;
            let ratingSum = getAllRatings.ratings
                .map((item) => item.star)
                .reduce((prev, curr) => prev + curr, 0);
            console.log(getAllRatings + " " + totalRating + " " + ratingSum)
            let actualRating = Math.round(ratingSum / totalRating);
            let productFinal = await Product.findByIdAndUpdate(prodId, {
                totalRating: actualRating,
            }, {
                new: true,
            });
            res.json(productFinal);
        }
    } catch (error) {
        throw new Error(error);
    };
});

const uploadImages = asyncHandler(async (req, res) => {
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
        const images = urls.map((file) =>{
            return file;
        });
        res.json(images)
    } catch (error) {
        throw new Error(error);
    }
});

const deleteImages = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
      const deleted = cloudinaryDeleteImg(id, "images");
      res.json({ message: "Deleted" });
    } catch (error) {
      throw new Error(error);
    }
  });

module.exports = { createProduct, getaProduct, getAllProduct, updateProduct, deleteProduct, addToWishList, rating, uploadImages,deleteImages}