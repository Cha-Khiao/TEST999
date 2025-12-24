

console.log('--- Script Starting ---');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const TransactionSchema = new mongoose.Schema({
    type: { type: String, enum: ['IN', 'OUT'], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    centerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Center' },
    quantity: { type: Number, required: true },
    donorName: { type: String },
    requesterName: { type: String },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
    proofUrl: { type: String },
    rejectionReason: { type: String },
    contactPhone: { type: String },
    isPickupRequired: { type: Boolean, default: false },
    pickupLocation: { type: String },
}, { timestamps: true });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function checkData() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const recent = await Transaction.find({ status: 'PENDING', type: 'IN' }).sort({ createdAt: -1 }).limit(3);
    console.log('--- Recent Top 3 Pending Donations ---');
    recent.forEach(t => {
        console.log(`ID: ${t._id}`);
        console.log(`Time: ${t.createdAt}`);
        console.log(`Donor: ${t.donorName}`);
        console.log(`Contact: ${t.contactPhone}`);
        console.log(`Pickup Required: ${t.isPickupRequired} (Type: ${typeof t.isPickupRequired})`);
        console.log(`Location: ${t.pickupLocation}`);
        console.log(`Proof URL Length: ${t.proofUrl?.length || 0}`);
        console.log('---------------------------');
    });

    // Check one that SHOULD have pickup
    const pickupOne = await Transaction.findOne({ isPickupRequired: true }).sort({ createdAt: -1 });
    if (pickupOne) {
        console.log('--- Most Recent Pickup Transaction ---');
        console.log(`ID: ${pickupOne._id}`);
        console.log(`Location: ${pickupOne.pickupLocation}`);
        console.log(`Proof: ${pickupOne.proofUrl?.substring(0, 50)}...`);
    } else {
        console.log('!!! NO PICKUP TRANSACTIONS FOUND !!!');
    }

    process.exit(0);
}

checkData().catch(console.error);
