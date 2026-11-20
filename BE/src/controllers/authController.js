import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// @desc  Đăng ký tài khoản
// @route POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email đã được sử dụng' })
    }

    const user = await User.create({ name, email, password })
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      token,
      user: { _id: user._id, name: user.name, email: user.email },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc  Đăng nhập
// @route POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' })
    }

    const token = generateToken(user._id)

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: { _id: user._id, name: user.name, email: user.email },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc  Lấy thông tin user hiện tại
// @route GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user })
}

// @desc  Cập nhật thông tin user
// @route PUT /api/auth/me
export const updateMe = async (req, res) => {
  try {
    const { name, preferences } = req.body
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, preferences },
      { new: true, runValidators: true }
    )
    res.json({ success: true, user })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}
