const User = require('../models/User');

// Créer les utilisateurs par défaut
async function initializeDefaultUsers() {
  try {
    // Vérifier si des utilisateurs existent déjà
    const userCount = await User.countDocuments();
    
    if (userCount > 0) {
      console.log('✅ Users already exist in database');
      return;
    }

    console.log('📝 Creating default users...');

    // Créer Admin
    const admin = await User.create({
      email: process.env.ADMIN_EMAIL || 'admin@safestep.com',
      password: process.env.ADMIN_PASSWORD || 'Admin123!SecurePassword',
      name: process.env.ADMIN_NAME || 'Administrator',
      role: 'admin',
      isVerified: true,
      isActive: true,
      avatar: 'AD'
    });

    console.log(`✅ Admin created: ${admin.email}`);

    // Créer Marie Joubert (utilisateur de démonstration)
    const marie = await User.create({
      email: 'marie.joubert@email.com',
      password: 'Password123!',
      name: 'Marie Joubert',
      age: 72,
      weight: 65,
      height: 165,
      gender: 'female',
      role: 'user',
      isVerified: true,
      isActive: true,
      avatar: 'MJ',
      medicalConditions: ['Parkinson\'s Disease', 'Hypertension'],
      allergies: ['Penicillin'],
      emergencyContacts: [
        {
          name: 'Dr. Laurent',
          phone: '+33 6 12 34 56 78',
          relation: 'doctor',
          isPrimary: true
        },
        {
          name: 'Sophie (Daughter)',
          phone: '+33 6 98 76 54 32',
          relation: 'family',
          isPrimary: false
        }
      ],
      deviceId: 'ESP32_001',
      deviceModel: 'SafeStep Pro v1',
      preferences: {
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        privacy: {
          shareData: false,
          publicProfile: false
        },
        language: 'fr',
        theme: 'light',
        units: {
          distance: 'metric',
          temperature: 'celsius'
        }
      }
    });

    console.log(`✅ User created: ${marie.email}`);

    // Créer Demo User
    const demo = await User.create({
      email: 'demo@safestep.com',
      password: 'Password123!',
      name: 'Demo User',
      age: 68,
      weight: 70,
      height: 170,
      gender: 'male',
      role: 'user',
      isVerified: true,
      isActive: true,
      avatar: 'DU',
      medicalConditions: ['Arthritis'],
      emergencyContacts: [
        {
          name: 'Emergency Services',
          phone: '112',
          relation: 'emergency',
          isPrimary: true
        }
      ],
      deviceId: 'ESP32_002',
      deviceModel: 'SafeStep Basic v1'
    });

    console.log(`✅ User created: ${demo.email}`);

    // Créer Doctor Account
    const doctor = await User.create({
      email: 'dr.laurent@hospital.com',
      password: 'Password123!',
      name: 'Dr. Laurent',
      age: 45,
      role: 'doctor',
      isVerified: true,
      isActive: true,
      avatar: 'DL'
    });

    console.log(`✅ Doctor created: ${doctor.email}`);

    // Créer Caregiver Account
    const caregiver = await User.create({
      email: 'sophie.joubert@email.com',
      password: 'Password123!',
      name: 'Sophie Joubert',
      age: 45,
      role: 'caregiver',
      isVerified: true,
      isActive: true,
      avatar: 'SJ'
    });

    console.log(`✅ Caregiver created: ${caregiver.email}`);

    console.log('\n🎉 Default users created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('─'.repeat(60));
    console.log('Admin:      admin@safestep.com / Admin123!SecurePassword');
    console.log('User 1:     marie.joubert@email.com / Password123!');
    console.log('User 2:     demo@safestep.com / Password123!');
    console.log('Doctor:     dr.laurent@hospital.com / Password123!');
    console.log('Caregiver:  sophie.joubert@email.com / Password123!');
    console.log('─'.repeat(60));

  } catch (error) {
    console.error('❌ Error creating default users:', error.message);
    throw error;
  }
}

// Réinitialiser la base de données (ATTENTION: supprime toutes les données!)
async function resetDatabase() {
  try {
    console.log('⚠️  Resetting database...');
    
    await User.deleteMany({});
    console.log('✅ All users deleted');

    await initializeDefaultUsers();
    
    console.log('✅ Database reset complete!');
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    throw error;
  }
}

module.exports = {
  initializeDefaultUsers,
  resetDatabase
};
