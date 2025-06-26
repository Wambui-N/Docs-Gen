import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
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

    try {
      // Create a new company for the new user in Supabase
      const { data: company, error: companyError } = await supabase
        .from('Company')
        .insert([
          { 
            clerk_user_id: id,
            name: 'My Company',
            about: '',
            website_url: '',
            tone_guidelines: ''
          }
        ])
        .select()
        .single();

      if (companyError) {
        console.error('Error creating company for new user:', companyError);
        return new Response('Error occured while creating company', {
          status: 500
        });
      }

      // Create default subscription
      const { error: subscriptionError } = await supabase
        .from('Subscription')
        .insert([
          {
            company_id: company.id,
            plan_name: 'pro',
            tokens_allocated: 100,
            tokens_used: 0,
            status: 'active'
          }
        ]);

      if (subscriptionError) {
        console.error('Error creating subscription for new user:', subscriptionError);
        return new Response('Error occured while creating subscription', {
          status: 500
        });
      }

      console.log('Company and subscription created successfully for user:', id);
    } catch (error) {
      console.error('Unexpected error:', error);
      return new Response('Error occured', {
        status: 500
      });
    }
  }

  return new Response('', { status: 200 });
}