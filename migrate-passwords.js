const mongoose = require('mongoose');
const { connectDB } = require('./database/db');
const { collegeInfo } = require('./database/schema');

require('dotenv').config();

async function migratePasswords() {
    try {
        // Connect to database
        await connectDB();
        console.log('Connected to database');

        // Find colleges without passwords or with empty passwords
        const collegesWithoutPasswords = await collegeInfo.find({
            $or: [
                { password: { $exists: false } },
                { password: null },
                { password: '' }
            ]
        });

        console.log(`Found ${collegesWithoutPasswords.length} colleges without passwords`);

        if (collegesWithoutPasswords.length === 0) {
            console.log('All colleges already have passwords set');
            return;
        }

        // Update colleges with default password
        const updateResult = await collegeInfo.updateMany(
            {
                $or: [
                    { password: { $exists: false } },
                    { password: null },
                    { password: '' }
                ]
            },
            {
                $set: { password: '123456' }
            }
        );

        console.log(`Updated ${updateResult.modifiedCount} colleges with default password '123456'`);
        
        // Display updated colleges
        if (updateResult.modifiedCount > 0) {
            console.log('\nColleges updated:');
            const updatedColleges = await collegeInfo.find({
                _id: { $in: collegesWithoutPasswords.map(c => c._id) }
            }).select('collegeName email');
            
            updatedColleges.forEach(college => {
                console.log(`- ${college.collegeName} (${college.email})`);
            });
        }

        console.log('\nPassword migration completed successfully!');
        console.log('Colleges can now log in with password: 123456');
        console.log('They can change their password using the "Change Password" feature in their profile.');

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        // Close database connection
        mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migratePasswords();
}

module.exports = migratePasswords;