import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dulich_ca_nhan_hoa')
    console.log(`✅ MongoDB đã kết nối: ${conn.connection.host}`)
  } catch (error) {
    console.error(`❌ Lỗi kết nối MongoDB: ${error.message}`)
    process.exit(1)
  }
}
