#!/usr/bin/env node
import bcrypt from 'bcrypt';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Admin Password Hash Generator\n');

rl.question('Enter admin username: ', (username) => {
  rl.question('Enter admin password: ', async (password) => {
    rl.close();
    
    if (!username || username.length < 3) {
      console.error('❌ Username must be at least 3 characters');
      process.exit(1);
    }
    
    if (!password || password.length < 8) {
      console.error('❌ Password must be at least 8 characters');
      process.exit(1);
    }
    
    console.log('\n⏳ Generating secure hash...\n');
    
    try {
      const hash = await bcrypt.hash(password, 10);
      
      console.log('✅ Password hash generated successfully!\n');
      console.log('Add these to your .env file or Render environment variables:\n');
      console.log('─'.repeat(60));
      console.log(`ADMIN_USERNAME=${username}`);
      console.log(`ADMIN_PASSWORD_HASH=${hash}`);
      console.log('─'.repeat(60));
      console.log('\n📋 For admin login, use:');
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${password}`);
      console.log('\n⚠️  Keep these credentials secure and never commit them to git!\n');
      
      // Generate admin token for testing
      const token = Buffer.from(JSON.stringify({ username, password })).toString('base64');
      console.log('🧪 Test admin token (for API calls):');
      console.log(`x-admin-token: ${token}\n`);
      
    } catch (error) {
      console.error('❌ Error generating hash:', error);
      process.exit(1);
    }
  });
});
