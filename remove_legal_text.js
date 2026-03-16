const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const LegalDoc = mongoose.model('LegalDoc', new mongoose.Schema({ key: String, title: String, htmlContent: String }));
    
    for (const key of ['privacy_policy', 'terms_conditions']) {
        const doc = await LegalDoc.findOne({ key });
        if (doc) {
            doc.htmlContent = doc.htmlContent.replace(/<p>This document is managed via the Admin Dashboard\. Please update the content from <strong>Admin → Legal<\/strong>\.<\/p>/g, '');
            await doc.save();
            console.log(`Updated ${key}`);
        }
    }
    await mongoose.disconnect();
}
run();
