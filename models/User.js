import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  user_id: {
    type: Number,
    min: 1000000,
    max: 9999999,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    minLength: 3,
    maxLength: 16,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  status_icon: {
    type: String,
    required: true,
    default:
      'https://res.cloudinary.com/dvhkp9wc6/image/upload/v1712917635/messaging_app/eegejkm8yz0f8qko0x1q.png',
  },
  status_text: {
    type: String,
    maxLength: 70,
    default: 'New TT user here!',
  },
  contacts: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
});

export default mongoose.model('User', UserSchema);
