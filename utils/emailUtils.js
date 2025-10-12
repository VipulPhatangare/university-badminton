const nodemailer = require('nodemailer');
require('dotenv').config();

// Test nodemailer configuration
async function testEmailConfiguration() {
    try {
        console.log('Testing email configuration...');
        
        // Create transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Verify connection
        await transporter.verify();
        console.log('✅ Email configuration is valid');
        console.log(`Email will be sent from: ${process.env.EMAIL_USER}`);
        
        return true;
    } catch (error) {
        console.error('❌ Email configuration error:', error.message);
        console.log('\nPlease check your .env file:');
        console.log('- EMAIL_USER should be your Gmail address');
        console.log('- EMAIL_PASS should be your Gmail app password (not regular password)');
        console.log('- Make sure 2-factor authentication is enabled on your Gmail account');
        console.log('- Generate an app password from Google Account settings');
        
        return false;
    }
}

// Test sending an email
async function testSendEmail(toEmail) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: 'Test Email - University Badminton',
            html: `
                <h2>Email Configuration Test</h2>
                <p>This is a test email from University Badminton system.</p>
                <p>If you received this, the email configuration is working correctly!</p>
                <p>Time: ${new Date().toLocaleString()}</p>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Test email sent successfully');
        console.log('Message ID:', result.messageId);
        
        return true;
    } catch (error) {
        console.error('❌ Failed to send test email:', error.message);
        return false;
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args[0] === 'test' && args[1]) {
        // Test sending email to specific address
        testSendEmail(args[1]);
    } else {
        // Just test configuration
        testEmailConfiguration();
    }
}

module.exports = {
    testEmailConfiguration,
    testSendEmail
};