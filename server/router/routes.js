const express = require('express');
const multer = require('multer');
const router = express.Router();
const adminAuthentication = require("../controller/adminAuthentication");
const userController = require('../controller/userController');
const downloadFileService = require('../controller/downloadService');



const fileSizeLimitErrorHandler = (error, req, res, next) => {
    if (error) {
        error.message = 'uploaded file should be less than 20MB';
        res.sendStatus(413).json({message:error.message});
    } else {
        next(error);
    }
};

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'pictures');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload = multer({ storage: fileStorage, fileFilter: fileFilter, limits: { fileSize: 20000000 } });
router.get('/', (req, res, next) => {
    res.send(`<h1>Server is running now......</h1>`);
});
router.post('/registration', adminAuthentication.adminRegistration,);
router.post('/login', adminAuthentication.adminLogin);
router.get('/users', adminAuthentication.isAuth, userController.fetchAllUsers);
router.get('/search',adminAuthentication.isAuth, userController.searchQuery);
router.post('/create',adminAuthentication.isAuth, upload.single('pic'), fileSizeLimitErrorHandler, userController.createUser);
router.get('/users/:id', adminAuthentication.isAuth, userController.getUser);
router.get('/downloadservice/:id', downloadFileService);
router.put('/edit-image/:id', upload.single('pic'), fileSizeLimitErrorHandler, userController.updateProfilePic);
router.put('/edit/:id',adminAuthentication.isAuth, userController.updateUser);
router.delete('/delete/:id',adminAuthentication.isAuth, userController.deleteUser);
router.put('/resetpassword',adminAuthentication.isAuth, adminAuthentication.resetPassword);
router.get('/logout', adminAuthentication.adminLogout);
module.exports = router;
