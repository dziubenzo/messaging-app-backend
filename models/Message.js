import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  from: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  to: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    maxLength: 5000,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
});

export default mongoose.model('Message', MessageSchema);
