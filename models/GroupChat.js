import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const GroupChatSchema = new Schema({
  name: {
    type: String,
    minLength: 3,
    maxLength: 32,
    required: true,
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  ],
  messages: [
    {
      sender: {
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
    },
  ],
});

export default mongoose.model('GroupChat', GroupChatSchema);
