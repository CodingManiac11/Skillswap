require('dotenv').config();
const mongoose = require('mongoose');
const Skill = require('./models/Skill');

async function checkSkills() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // All skills
    const allSkills = await Skill.find({}).select('skillName proofUrl verificationStatus');
    console.log('\n=== All Skills ===');
    console.log('Total skills:', allSkills.length);

    // Skills with proofUrl
    const withProof = allSkills.filter(s => s.proofUrl && s.proofUrl.trim() !== '');
    console.log('\n=== Skills with proofUrl ===');
    console.log('Count:', withProof.length);
    withProof.forEach(s => {
        console.log(`- ${s.skillName}: proofUrl="${s.proofUrl}", status="${s.verificationStatus}"`);
    });

    // Skills pending verification
    const pending = await Skill.find({
        proofUrl: { $exists: true, $ne: '' },
        $or: [
            { verificationStatus: 'pending' },
            { verificationStatus: { $exists: false } },
            { verificationStatus: null },
            { verificationStatus: '' }
        ]
    });
    console.log('\n=== Pending Verification ===');
    console.log('Count:', pending.length);
    pending.forEach(s => {
        console.log(`- ${s.skillName}: proofUrl="${s.proofUrl}", status="${s.verificationStatus}"`);
    });

    // Verified skills
    const verified = await Skill.countDocuments({ verificationStatus: 'verified' });
    console.log('\n=== Verified Skills Count:', verified);

    await mongoose.disconnect();
}

checkSkills().catch(console.error);
