import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabaseClient';

// Disable body parsing for this route, as we need the raw body to verify the webhook signature.
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  // Handle the user.created event
  if (eventType === 'user.created') {
    console.log(`User ${id} was ${eventType}`);

    // Create a new company for the new user in Supabase
    const { data, error } = await supabase
      .from('Company')
      .insert([
        { 
          clerk_user_id: id,
          name: 'My New Company', // Default name
        }
      ]);

    if (error) {
      console.error('Error creating company for new user:', error);
      return new Response('Error occured while creating company', {
        status: 500
      });
    }

    console.log('Company created successfully for user:', id);
  }

  return new Response('', { status: 200 });
} 