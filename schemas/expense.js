import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['Dining and Leisure', 'Food and Housekeeping', 'Family and Housing', 'Car Maintenance', 'Hobbies'],
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    recurrence: {
        type: String,
        required: true,
        enum: ['None', 'Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Yearly'],
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
