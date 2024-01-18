// models/Income.js
import mongoose from 'mongoose';

const incomeSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['Wages', 'Dividends', 'Interests', 'Rents', 'Miscellaneous'],
        trim: true
    },
    description: {
        type: String,
        required: false,
        trim: true
    },
    amount: {
        type: Number,
        required: true
    },
    recurrence: {
        type: String,
        required: true,
        enum: ['None', 'Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Yearly'],
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

const Income = mongoose.model('Income', incomeSchema);
export default Income;
