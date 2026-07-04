// backend/middleware/authMiddleware.js
import { getAuth } from '@clerk/express';
import User from '../models/User.js';

// Protects routes, ensures user has valid Clerk session and MongoDB profile
const protect = async (req, res, next) => {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      return res.status(401).json({ message: 'Not authorized, no Clerk session' });
    }

    // Fetch user from MongoDB by Clerk ID
    let mongoUser = await User.findOne({ clerkId: auth.userId });

    // Self-healing: If user exists in Clerk but not yet synced to MongoDB (e.g., local development webhook issues)
    if (!mongoUser) {
      console.log(`👤 Clerk ID ${auth.userId} not found in MongoDB. Attempting auto-creation...`);
      try {
        const { createClerkClient } = await import('@clerk/backend');
        const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        
        const clerkUser = await clerkClient.users.getUser(auth.userId);
        
        const primaryEmailId = clerkUser.primaryEmailAddressId;
        const emailObj = clerkUser.emailAddresses?.find(e => e.id === primaryEmailId) || clerkUser.emailAddresses?.[0];
        const email = emailObj ? emailObj.emailAddress : null;

        const primaryPhoneId = clerkUser.primaryPhoneNumberId;
        const phoneObj = clerkUser.phoneNumbers?.find(p => p.id === primaryPhoneId) || clerkUser.phoneNumbers?.[0];
        const phone = phoneObj ? phoneObj.phoneNumber : '';

        const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || 'Unnamed User';
        const profileImage = clerkUser.imageUrl || '/images/default_user.png';
        const isAdmin = !!clerkUser.publicMetadata?.isAdmin;

        // Try to link by email first if exists
        if (email) {
          mongoUser = await User.findOne({ email });
        }

        if (mongoUser) {
          console.log(`🔗 Auto-linking existing MongoDB user by email: ${email}`);
          mongoUser.clerkId = auth.userId;
          await mongoUser.save();
        } else {
          console.log(`🆕 Auto-creating new MongoDB user for: ${email}`);
          mongoUser = await User.create({
            clerkId: auth.userId,
            email,
            phone: phone || undefined,
            name,
            profileImage,
            isAdmin,
          });
        }
      } catch (syncError) {
        console.error('❌ Failed to self-heal/sync user profile from Clerk:', syncError.message);
        return res.status(401).json({ message: 'Not authorized, user profile sync failed' });
      }
    }

    // Attach MongoDB user to request object
    req.user = mongoUser;
    next();
  } catch (error) {
    console.error('Error in protect middleware:', error);
    res.status(401).json({ message: 'Not authorized, token validation failed' });
  }
};

// Middleware to check if the user is an admin
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

export { protect, admin };