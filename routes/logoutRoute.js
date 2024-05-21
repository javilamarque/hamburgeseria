const express = require('express')
const router = express.Router()
const logoutController = require('../controller/logoutController')


router.get('/logout', logoutController.logout)

module.exports = router