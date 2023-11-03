const objectId = require('mongodb').ObjectId;
const User = require('../model/userSchema');
const Family = require('../model/familySchema');
const fs = require('fs');



const deletePicturePath = (filepath, next) => {
    if (filepath) {
        fs.unlink(filepath, (err) => {
            if (err) {
                const error = new Error();
                error.statusCode = 424;
                error.message = `Requested image-path doesn't exist try uploading it again.`;
                Promise.reject(error);
            }
        }
        )
    }
    return;
};




const searchQuery = async (req, res, next) => {
    let { query, type } = req.query;
    const limit = parseInt(req.query.limit || 9);
    const skip = parseInt(req.query.skip || 0);


    try {
        let searchedQueryUsers;
        let total;
        //Query using regex ---convert query to new RegEx(query) Object----
        /*  total = await User.countDocuments( ""{"name":{$regex:query, $options:'i'}} );
         searchedQueryUsers = await User.find({ "name":{$regex:query, $options:'i'}}).skip(skip).limit(limit);
         console.log(searchedQueryUsers);
                 if (!searchedQueryUsers) {
                     return res.status(404).json({ message: "voter not found" });
                 }; */

        switch (type) {
            case "text":
                total = await User.countDocuments({ $text: { $search: query } });
                searchedQueryUsers = await User.find({ $text: { $search: query } }).skip(skip).limit(limit).sort();
                if (!searchedQueryUsers) {
                    return res.status(404).json({ message: "voter not found" });
                };
                break;
        };

        return res.status(200).json({ total: total, users: searchedQueryUsers });
    } catch (error) {
        next(error);
    }
};




const createUser = async (req, res, next) => {
    const { houseno, name, epicno, gender, age } = req.body;
    const image = (req.file) ? req.file.path : null;

    try {
        //const findFamily = await Family.findOne({ family_id: `${partno}-${houseno}` });
        //if (findFamily === null) 
        //{
           //findFamily = new Family({ family_id: `${partno}-${houseno}`, members: null });
            //await findFamily.save();
        //};
        const user = new User({ houseno: houseno, name: name, epicno: epicno, gender: gender, age: age});
        if (!user) {
            const error = new Error('Failed to create');
            throw error;
        };
        await user.save();
        //await Family.findByIdAndUpdate({ _id: new objectId(findFamily._id) }, {
            //$push: { members: new objectId(user._id) }
        //});
        //await findFamily.save();
        return res.status(201).json({ message: 'User created successfully' });

    }
    catch (error) {
        if (error._message === 'User validation failed') {
            error.statusCode = 424;
            error.message = 'Failed to create a new user';
            return next(error);
        };
        error.statusCode = 500;
        next(error);
    }

};




const fetchAllUsers = async (req, res, next) => {

    const limit = parseInt(req.query.limit || 9);
    const skip = parseInt(req.query.skip || 0);
    try {
        let total;
        total = await User.countDocuments({});
        const users = await User.find({}).skip(skip).limit(limit);
        if (!users) {
            const error = new Error(`Database is empty`);
            error.statusCode = 404;
            throw error;
        }
        return res.status(200).json({ total: total, users: users });
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};





const getUser = async (req, res, next) => {
    const _id = req.params.id;
    try {
        const user = await User.findOne({ _id: _id });
        const family = await Family.findOne({ _id: user.family._id }).populate({ path: "members", model: 'User' }).exec();
        if (user) {
            return res.status(200).json({ user: user, family: family });
        }
        const error = new Error('User not found')
        throw error;
    }
    catch (error) {
        if (error.statusCode !== 500) {
            error.message = "User not found";
            error.statusCode = 404;
            return next(error);
        };
        error.statusCode = 500;
        next(err);
    }
};





const updateProfilePic = async (req, res, next) => {
    const _id = req.params.id;
    const image = req.file.path;
    try {
        const deleteFilePath = await User.findById(new objectId(_id));
        deletePicturePath(deleteFilePath.image, next);
        const user = await User.findByIdAndUpdate(new objectId(_id), { image: image });
        if (!user) {
            const error = new Error(`Falied to update`);
            error.statusCode = 409;
            throw error;
        };
        await user.save();
        return res.status(200).json({ message: 'Picture updated successfully' });
    }
    catch (error) {
        if (err === undefined) {
            err.statusCode = 404;
            err.message = 'User not found';
        };
        err.statusCode = 424;
        err.message = 'Unable to perform operation';
        next(err);
    }
};



async function updateUser(req, res, next) {
    const { acno, slno, partno, houseno, name, relation, relativename, epicno, gender, age } = req.body;
    const _id = req.params.id;
    
    try {
        const updateFamily = await Family.findOne({ family_id: `${partno}-${houseno}` });
        if (updateFamily === null) {
            updateFamily = new Family({ family_id: `${partno}-${houseno}` });
            await updateFamily.save();
        };
        const user = await User.findByIdAndUpdate(new objectId(_id), { acno: acno, slno: slno, partno: partno, houseno: houseno, name: name, relation: relation, relativename: relativename, epicno: epicno, gender: gender, age: age, family: updateFamily._id });
        if (!user) {
            const error = new Error(`Falied to update`);
            error.statusCode = 409;
            throw error;
        };
        await user.save();
        await Family.findByIdAndUpdate({ _id: new objectId(updateFamily._id) }, {
            $push: { members: new objectId(user._id) }
        });
        const removeDuplicates = updateFamily.members.reduce((accumulator, currentValue) => {
            if (!accumulator.includes(currentValue)) {
                return [...accumulator, currentValue];
            };
            return accumulator;
        }, []);
        await Family.findByIdAndUpdate({ _id: new objectId(updateFamily._id) }, {
            $set: { members: [...removeDuplicates] }
        });
        await updateFamily.save();
        return res.status(201).json({ message: 'Updated successfully' });

    } catch (err) {
        if (err === undefined) {
            err.statusCode = 404;
            err.message = 'User not found';
        };
        err.statusCode = 424;
        err.message = 'Unable to perform operation';
        next(err);
    }
};




const deleteUser = async (req, res, next) => {
    const _id = req.params.id;
    try {
        const user = await User.findById(new objectId(_id));
        deletePicturePath(user.image);
        await User.findByIdAndRemove(new objectId(_id));
        return res.status(200).json({ message: 'Successfully deleted' });

    } catch (error) {
        if (error === undefined) {
            error.message = "Unable to delete the user";
            error.statusCode = 424;
            return next(error);
        };
        error.statusCode = 500;
        next(error);
    }
};


exports.updateProfilePic = updateProfilePic;
exports.createUser = createUser;
exports.deleteUser = deleteUser;
exports.getUser = getUser;
exports.updateUser = updateUser;
exports.searchQuery = searchQuery;
exports.fetchAllUsers = fetchAllUsers;

