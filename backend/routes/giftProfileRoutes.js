const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddlewares');
const {
  getProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
  addGiftHistory
} = require('../controllers/giftProfileController');

router.use(protect);

router.get('/', getProfiles);
router.post('/', createProfile);
router.get('/:id', getProfileById);
router.put('/:id', updateProfile);
router.delete('/:id', deleteProfile);
router.post('/:id/gift-history', addGiftHistory);

module.exports = router;
