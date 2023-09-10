const express = require('express');
const {createCoupon, getAllCoupons, updateCoupon, deleteCoupon} = require('../controller/couponController');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post("/",authMiddleware,isAdmin,createCoupon);
router.get("/",getAllCoupons);
router.put("/:id",authMiddleware,isAdmin,createCoupon);
router.delete("/:id",authMiddleware,isAdmin,deleteCoupon);



module.exports = router;