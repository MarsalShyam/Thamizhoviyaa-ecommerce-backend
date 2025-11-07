// backend/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';


const addressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  // _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
  isDefault: { type: Boolean, default: false },
});


const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    // Email is optional (some users might register with phone only)
    email: { type: String, unique: true, sparse: true },

    phone: { type: String, required: true, unique: true },

    password: { type: String, required: true },


    isAdmin: { type: Boolean, required: true, default: false },


    addresses: [addressSchema],


    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],


    profileImage: {
      type: String,
      default: '/images/default_user.png',
    },
  },
  {
    timestamps: true,
  }
);


userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


const User = mongoose.model('User', userSchema);
export default User;
