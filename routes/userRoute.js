const express = require('express');
const UserController = require('../controller/userController');
const router = express.Router();

router.post('/login', UserController.loginUser);
router.get('/users', UserController.getAllUsers);
router.get('/register', UserController.getRegisterPage);
router.post('/register', UserController.registerUser);
router.get('/users/edit/:id', UserController.getEditUserPage);
router.post('/users/edit/:id', UserController.editUserById);
router.delete('/users/:id', UserController.deleteUserById);

module.exports = router;