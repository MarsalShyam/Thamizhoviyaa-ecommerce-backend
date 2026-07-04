// backend/controllers/clerkWebhookController.js
import { Webhook } from 'svix';
import User from '../models/User.js';

export const handleClerkWebhook = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('❌ CLERK_WEBHOOK_SECRET is missing from environment variables.');
    return res.status(500).json({ message: 'Clerk Webhook Secret is missing' });
  }

  // Get the headers
  const svix_id = req.headers['svix-id'];
  const svix_timestamp = req.headers['svix-timestamp'];
  const svix_signature = req.headers['svix-signature'];

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ message: 'Error: Missing svix headers' });
  }

  // Get raw body
  const payload = req.body; // Since we mount with express.raw, this is a Buffer

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;

  // Attempt to verify the webhook payload
  try {
    evt = wh.verify(payload.toString(), {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('❌ Webhook verification failed:', err.message);
    return res.status(400).json({ message: 'Error: Webhook signature verification failed' });
  }

  const eventType = evt.type;
  const data = evt.data;

  console.log(`ℹ️ Received Clerk webhook event: ${eventType} (ID: ${data.id})`);

  try {
    if (eventType === 'user.created') {
      const clerkId = data.id;

      // Extract email
      const primaryEmailId = data.primary_email_address_id;
      const emailObj = data.email_addresses?.find(e => e.id === primaryEmailId) || data.email_addresses?.[0];
      const email = emailObj ? emailObj.email_address : null;

      // Extract phone
      const primaryPhoneId = data.primary_phone_number_id;
      const phoneObj = data.phone_numbers?.find(p => p.id === primaryPhoneId) || data.phone_numbers?.[0];
      const phone = phoneObj ? phoneObj.phone_number : '';

      // Extract name
      const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Unnamed User';

      // Extract profile image
      const profileImage = data.image_url || '/images/default_user.png';

      // Check if user should be admin (from public metadata)
      const isAdmin = !!data.public_metadata?.isAdmin;

      // 1. Try to find user by email to link existing custom account
      let user = null;
      if (email) {
        user = await User.findOne({ email });
      }

      if (user) {
        console.log(`🔗 Linking existing user account: ${email} -> Clerk ID: ${clerkId}`);
        user.clerkId = clerkId;
        user.name = name;
        user.profileImage = profileImage;
        if (phone && !user.phone) {
          user.phone = phone;
        }
        await user.save();
      } else {
        console.log(`🆕 Creating new MongoDB user for Clerk ID: ${clerkId}`);
        await User.create({
          clerkId,
          email,
          phone: phone || undefined,
          name,
          profileImage,
          isAdmin,
        });
      }
    }

    if (eventType === 'user.updated') {
      const clerkId = data.id;

      // Extract details
      const primaryEmailId = data.primary_email_address_id;
      const emailObj = data.email_addresses?.find(e => e.id === primaryEmailId) || data.email_addresses?.[0];
      const email = emailObj ? emailObj.email_address : null;

      const primaryPhoneId = data.primary_phone_number_id;
      const phoneObj = data.phone_numbers?.find(p => p.id === primaryPhoneId) || data.phone_numbers?.[0];
      const phone = phoneObj ? phoneObj.phone_number : '';

      const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Unnamed User';
      const profileImage = data.image_url || '/images/default_user.png';
      const isAdmin = data.public_metadata?.isAdmin !== undefined ? !!data.public_metadata.isAdmin : undefined;

      const user = await User.findOne({ clerkId });
      if (user) {
        user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        user.profileImage = profileImage;
        if (isAdmin !== undefined) {
          user.isAdmin = isAdmin;
        }
        await user.save();
        console.log(`🔄 Updated user details in MongoDB for Clerk ID: ${clerkId}`);
      } else {
        // Fallback: If user.updated happens but user doesn't exist in MongoDB, create them
        console.log(`⚠️ User not found on update. Creating new user for Clerk ID: ${clerkId}`);
        await User.create({
          clerkId,
          email,
          phone: phone || undefined,
          name,
          profileImage,
          isAdmin: !!isAdmin,
        });
      }
    }

    if (eventType === 'user.deleted') {
      const clerkId = data.id;
      const result = await User.deleteOne({ clerkId });
      console.log(`🗑️ Deleted MongoDB user for Clerk ID: ${clerkId}. Deleted count: ${result.deletedCount}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error handling webhook event:', error);
    return res.status(500).json({ message: 'Internal server error while processing webhook' });
  }
};
