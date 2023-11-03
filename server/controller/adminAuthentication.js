const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../model/adminSchema');


const adminRegistration = async (req, res, next) => {
    const { name, email, password, confirm_password } = req.body;
    if (!name || !email || !password || !confirm_password) {
        const error = new Error('fill up all the fields');
        error.statusCode = 409;
        throw error;

    }
    try {
        const adminAlreadyExist = await Admin.findOne({ email: email });

        if (adminAlreadyExist) {
            const error = new Error('User already exist');
            error.statusCode = 409;
            throw error;
        }

        else if (password !== confirm_password) {
            const error = new Error(`password doens't match`);
            error.statusCode = 424;
            throw error;
        }

        else {
            const hashPassWord = await bcrypt.hash(password, 12);
            const hashConfirmPassWord = await bcrypt.hash(confirm_password, 12);
            const admin = new Admin({ name: name, email: email, password: hashPassWord, confirm_password: hashConfirmPassWord });

            if (!admin) {
                const error = new Error('failed to register user');
                error.statusCode = 424;
                throw error;
            };

            await admin.save();
            return res.status(201).json({ message: 'you have registed successfully', admin });
        }
    }
    catch (error) {
        next(error);
    }
};





const adminLogin = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await Admin.findOne({ email: email });
        if (!user) {
            const error = new Error();
            error.statusCode = 409;
            error.message = `Email or Password is incorrect.`;
            throw error;
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch === false) {
            const error = new Error();
            error.statusCode = 401;
            error.message = `Email or Password is incorrect.`;
            throw error;
        }
        const token = jwt.sign({ _id: user._id, name: user.name, email: user.email }, process.env.SECRET_KEY, { expiresIn: '1h' });
        return res.status(200).json({ token: token, user: user, message: 'Logged in successfully', status:200 });
    } catch (error) {
        next(error);
    }
};




const isAuth = (req, res, next) => {
    let token;
    let verifiedToken;
    const authorization = req.headers.authorization;
    console.log(req.body)
    console.log(req.headers);
    if (authorization && authorization.startsWith('Bearer')) {
        token = authorization.split(' ')[1];
        try {
            verifiedToken = jwt.verify(token, process.env.SECRET_KEY);
            console.log(verifiedToken);
            req._id = verifiedToken._id;
            req.name = verifiedToken.name;
            req.email = verifiedToken.email;
            return next();
        } catch (error) {
            next(error);
        }
    };
    return res.status(403).json({ message: 'authentication failed',status:403 });
};





const resetPassword = async (req, res, next) => {
    const { id, password, new_password, confirm_newpassword } = req.body;

    try {

        if (new_password !== confirm_newpassword) {
            const error = new Error();
            error.statusCode = 409;
            error.message = `New-password and Confirm-password don't match.`;
            throw error;
        };
        const user = await Admin.findOne({ _id: id });
        if (!user) {
            const error = new Error();
            error.statusCode = 403;
            error.message = 'Failed to change password.';
            throw error;
        };
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch === false) {
            const error = new Error();
            error.statusCode = 401;
            error.message = `Old-password is incorrect.`;
            throw error;
        };
        const newPassword = await bcrypt.hash(new_password, 12);
        const confirmNewPassword = await bcrypt.hash(confirm_newpassword, 12);
        const updateUser = await Admin.findByIdAndUpdate(user._id, { $set: { password: newPassword, confirm_newpassword: confirmNewPassword } });
        await updateUser.save();
        return res.status(200).json({ message: 'Password changed successfully.', status: 200 });
    } catch (error) {
        console.log(error);
        next(error);
    }
};




const adminLogout = (req, res, next) => {
    res.clearCookie('jwtoken');
    res.status(200).json({ message: 'user logged out.' });
};

exports.resetPassword = resetPassword;
exports.adminRegistration = adminRegistration;
exports.adminLogin = adminLogin;
exports.isAuth = isAuth;
exports.adminLogout = adminLogout;