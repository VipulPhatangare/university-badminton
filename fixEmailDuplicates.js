const { connectDB } = require('./database/db');
const mongoose = require('mongoose');

async function fixEmailDuplicates() {
    try {
        await connectDB();
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        const collection = db.collection('playerinfoids');
        
        console.log('=== Current Database Indexes ===');
        const indexes = await collection.indexes();
        indexes.forEach(index => {
            console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
        });
        
        // 1. First, drop the email unique index if it exists
        console.log('\n=== Dropping Email Index ===');
        try {
            await collection.dropIndex('email_1');
            console.log('✅ Successfully dropped email_1 index');
        } catch (error) {
            if (error.codeName === 'IndexNotFound') {
                console.log('ℹ️  Email index not found (already removed)');
            } else {
                console.log('❌ Error dropping index:', error.message);
            }
        }
        
        // 2. Update all players with null emails to remove the email field entirely
        console.log('\n=== Removing null email fields ===');
        const nullEmailResult = await collection.updateMany(
            { email: null },
            { $unset: { email: "" } }
        );
        console.log(`✅ Removed null email fields from ${nullEmailResult.modifiedCount} players`);
        
        // 3. Find players with duplicate emails and handle them
        console.log('\n=== Finding duplicate emails ===');
        const duplicateEmails = await collection.aggregate([
            { $match: { email: { $exists: true, $ne: null } } },
            { $group: { _id: "$email", count: { $sum: 1 }, players: { $push: "$$ROOT" } } },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();
        
        console.log(`Found ${duplicateEmails.length} duplicate email groups`);
        
        if (duplicateEmails.length > 0) {
            for (const group of duplicateEmails) {
                console.log(`\nEmail: ${group._id} (${group.count} duplicates)`);
                
                // Keep the first player with this email, remove email from others
                for (let i = 1; i < group.players.length; i++) {
                    const player = group.players[i];
                    await collection.updateOne(
                        { _id: player._id },
                        { $unset: { email: "" } }
                    );
                    console.log(`  - Removed email from: ${player.playerName} (${player.collegeName})`);
                }
            }
        }
        
        // 4. Ensure all players have playerIdentifier
        console.log('\n=== Ensuring playerIdentifier for all players ===');
        const playersWithoutIdentifier = await collection.find({ 
            playerIdentifier: { $exists: false } 
        }).toArray();
        
        console.log(`Found ${playersWithoutIdentifier.length} players without identifier`);
        
        for (const player of playersWithoutIdentifier) {
            const identifier = `${player.playerName.replace(/\s+/g, '_').toLowerCase()}_${player.gender}_${player.collegeName.replace(/\s+/g, '_').toLowerCase()}`;
            
            await collection.updateOne(
                { _id: player._id },
                { $set: { playerIdentifier: identifier } }
            );
            console.log(`  - Added identifier to: ${player.playerName}`);
        }
        
        // 5. Create unique index on playerIdentifier
        console.log('\n=== Creating playerIdentifier index ===');
        try {
            await collection.createIndex({ playerIdentifier: 1 }, { unique: true });
            console.log('✅ Created unique index on playerIdentifier');
        } catch (error) {
            if (error.code === 11000) {
                console.log('❌ Duplicate playerIdentifiers found. Fixing...');
                
                // Find and fix duplicate identifiers
                const duplicateIdentifiers = await collection.aggregate([
                    { $group: { _id: "$playerIdentifier", count: { $sum: 1 }, players: { $push: "$$ROOT" } } },
                    { $match: { count: { $gt: 1 } } }
                ]).toArray();
                
                for (const group of duplicateIdentifiers) {
                    console.log(`Duplicate identifier: ${group._id}`);
                    for (let i = 1; i < group.players.length; i++) {
                        const player = group.players[i];
                        const newIdentifier = `${group._id}_${i}`;
                        await collection.updateOne(
                            { _id: player._id },
                            { $set: { playerIdentifier: newIdentifier } }
                        );
                        console.log(`  - Updated to: ${newIdentifier}`);
                    }
                }
                
                // Try creating index again
                await collection.createIndex({ playerIdentifier: 1 }, { unique: true });
                console.log('✅ Created unique index on playerIdentifier (after fixing duplicates)');
            } else {
                console.log('ℹ️  playerIdentifier index already exists');
            }
        }
        
        // 6. Final verification
        console.log('\n=== Final Verification ===');
        const finalIndexes = await collection.indexes();
        console.log('Final indexes:');
        finalIndexes.forEach(index => {
            console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
        });
        
        const totalPlayers = await collection.countDocuments({});
        const playersWithEmail = await collection.countDocuments({ email: { $exists: true } });
        const playersWithIdentifier = await collection.countDocuments({ playerIdentifier: { $exists: true } });
        
        console.log(`\nTotal players: ${totalPlayers}`);
        console.log(`Players with email: ${playersWithEmail}`);
        console.log(`Players with identifier: ${playersWithIdentifier}`);
        
        console.log('\n✅ Database cleanup completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
        console.error(error);
    } finally {
        mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the cleanup
fixEmailDuplicates();