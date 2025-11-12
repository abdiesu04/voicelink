import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import axios from "axios";
import Stripe from "stripe";
import { PLAN_DETAILS } from "@shared/schema";
import cookie from "cookie";
import signature from "cookie-signature";
import { Pool } from "@neondatabase/serverless";

const sessionPool = new Pool({ connectionString: process.env.DATABASE_URL });
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required for WebSocket authentication');
}

// From javascript_stripe blueprint integration
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

interface RoomConnection {
  ws: WebSocket;
  roomId: string;
  language: string;
  voiceGender: "male" | "female";
  role: "creator" | "participant";
}

interface SessionTracking {
  roomId: string;
  userId: number;
  startTime: number;
  lastDeductionTime: number;
  intervalId: NodeJS.Timeout;
  isActive: boolean;
}

const connections = new Map<WebSocket, RoomConnection>();
const roomConnections = new Map<string, WebSocket[]>();
const activeSessions = new Map<string, SessionTracking>(); // roomId -> session tracking
const broadcastedMessageIds = new Map<string, Map<string, number>>(); // roomId -> Map<dedupeKey, timestamp> for TTL-based deduplication

// Helper function to get userId from WebSocket session
async function getUserIdFromWebSocketSession(req: any): Promise<number | null> {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const sessionCookieName = 'connect.sid';
    let signedSessionId = cookies[sessionCookieName];
    
    if (!signedSessionId) {
      console.log('[WebSocket Auth] No session cookie found');
      return null;
    }
    
    // Verify and unsign the session cookie (express-session adds 's:' prefix and HMAC signature)
    if (!signedSessionId.startsWith('s:')) {
      console.log('[WebSocket Auth] Invalid session cookie format');
      return null;
    }
    
    // Remove 's:' prefix and verify signature
    const unsignedValue = signature.unsign(signedSessionId.slice(2), SESSION_SECRET!);
    
    if (unsignedValue === false) {
      console.log('[WebSocket Auth] Invalid session cookie signature');
      return null;
    }
    
    const sessionId = unsignedValue;
    
    // Query session from PostgreSQL
    const result = await sessionPool.query(
      'SELECT sess FROM session WHERE sid = $1',
      [sessionId]
    );
    
    if (result.rows.length === 0) {
      console.log('[WebSocket Auth] Session not found in database');
      return null;
    }
    
    const sessionData = result.rows[0].sess;
    const userId = sessionData.userId || null;
    
    if (userId) {
      console.log(`[WebSocket Auth] Authenticated user ID: ${userId}`);
    } else {
      console.log('[WebSocket Auth] No userId in session');
    }
    
    return userId;
  } catch (error) {
    console.error('[WebSocket Auth] Error getting userId from session:', error);
    return null;
  }
}

function endSession(roomId: string, reason: 'participant-left' | 'creator-left' | 'credits-exhausted') {
  console.log(`[Session] Ending session for room ${roomId}, reason: ${reason}`);
  
  const session = activeSessions.get(roomId);
  if (session) {
    const totalDuration = Math.floor((Date.now() - session.startTime) / 1000);
    console.log(`[Session] Total duration: ${totalDuration}s`);
    
    clearInterval(session.intervalId);
    session.isActive = false;
    activeSessions.delete(roomId);
  }
  
  const clients = roomConnections.get(roomId) || [];
  
  clients.forEach(client => {
    connections.delete(client);
    
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'session-ended',
        reason
      }));
      
      client.close(1000, `Session ended: ${reason}`);
    }
  });
  
  roomConnections.delete(roomId);
  broadcastedMessageIds.delete(roomId); // Clean up server-side deduplication tracking
  storage.deleteRoom(roomId);
  
  console.log(`[Session] Cleaned up room ${roomId}, notified ${clients.length} clients, cleared deduplication tracking`);
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/rooms/create", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Note: Email verification temporarily disabled for testing
      // TODO: Re-enable email verification before production deployment
      
      const { language, voiceGender } = req.body;
      
      if (!language) {
        return res.status(400).json({ error: "Language is required" });
      }
      
      if (!voiceGender) {
        return res.status(400).json({ error: "Voice gender is required" });
      }

      const room = await storage.createRoom(req.session.userId, language, voiceGender);
      
      res.json({ roomId: room.id });
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ error: "Failed to create room" });
    }
  });

  app.get("/api/rooms/:roomId", async (req, res) => {
    try {
      const { roomId } = req.params;
      const room = await storage.getRoom(roomId);
      
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      res.json(room);
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ error: "Failed to fetch room" });
    }
  });

  app.get("/api/speech/token", async (req, res) => {
    try {
      const speechKey = process.env.AZURE_SPEECH_KEY;
      const speechRegion = process.env.AZURE_SPEECH_REGION;

      if (!speechKey || !speechRegion) {
        return res.status(500).json({ error: "Azure Speech credentials not configured" });
      }

      const tokenResponse = await axios.post(
        `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
        '',
        {
          headers: {
            'Ocp-Apim-Subscription-Key': speechKey,
            'Content-Length': '0',
          },
        }
      );

      res.json({
        token: tokenResponse.data,
        region: speechRegion,
      });
    } catch (error) {
      console.error("Error getting speech token:", error);
      res.status(500).json({ error: "Failed to get speech token" });
    }
  });

  // Stripe Checkout Session - Create subscription checkout
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { plan } = req.body;
      
      if (!plan || (plan !== 'starter' && plan !== 'pro')) {
        return res.status(400).json({ error: "Invalid plan. Must be 'starter' or 'pro'" });
      }

      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get or create Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id.toString(),
          },
        });
        customerId = customer.id;
        await storage.setUserStripeCustomerId(user.id, customerId);
      }

      // Get price ID from environment variable
      const priceId = plan === 'starter' 
        ? process.env.STRIPE_STARTER_PRICE_ID 
        : process.env.STRIPE_PRO_PRICE_ID;

      if (!priceId) {
        return res.status(500).json({ error: `Price ID not configured for ${plan} plan` });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        success_url: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : req.headers.origin}/pricing`,
        client_reference_id: user.id.toString(),
        metadata: {
          userId: user.id.toString(),
          plan,
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session", details: error.message });
    }
  });

  // Stripe Billing Portal - Manage subscription
  app.post("/api/create-billing-portal-session", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await storage.getUserById(req.session.userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ error: "No Stripe customer found. Please subscribe first." });
      }

      // Create billing portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : req.headers.origin}/account`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating billing portal session:", error);
      res.status(500).json({ error: "Failed to create billing portal session", details: error.message });
    }
  });

  // Helper function: Activate subscription after successful payment (shared by webhooks and verification endpoint)
  async function activateSubscription(userId: number, plan: 'starter' | 'pro', stripeSubscriptionId: string, stripePriceId: string) {
    const currentSubscription = await storage.getSubscription(userId);
    
    // Idempotency: Skip ONLY if subscription already matches target plan, Stripe subscription ID, AND price ID
    if (
      currentSubscription?.plan === plan &&
      currentSubscription?.stripeSubscriptionId === stripeSubscriptionId &&
      currentSubscription?.stripePriceId === stripePriceId
    ) {
      console.log(`[Subscription] User ${userId} already has ${plan} plan with subscription ${stripeSubscriptionId} - skipping activation`);
      return currentSubscription;
    }

    console.log(`[Subscription] Activating ${plan} for user ${userId}, subscription ${stripeSubscriptionId}`);

    // Update user's subscription in database
    await storage.setSubscriptionStripeInfo(userId, stripeSubscriptionId, stripePriceId);
    
    // Upgrade user to paid plan with full minute allocation
    const planDetails = PLAN_DETAILS[plan];
    const creditsInSeconds = planDetails.credits * 60;
    
    await storage.updateSubscription(userId, {
      plan,
      creditsRemaining: creditsInSeconds,
      billingCycleStart: new Date(),
      billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    console.log(`[Subscription] ✓ Activated ${plan} subscription for user ${userId} with ${planDetails.credits} minutes`);
    
    return await storage.getSubscription(userId);
  }

  // Payment Verification Endpoint - For development only when webhooks aren't available
  app.post("/api/payments/verify", async (req, res) => {
    // Security: Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: "Payment verification is only available in development. Use Stripe webhooks in production." });
    }

    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { sessionId } = req.body;
      
      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: "Valid session_id is required" });
      }

      // Retrieve the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Verify session belongs to current user
      const userId = parseInt(session.metadata?.userId || session.client_reference_id || '0');
      if (userId !== req.session.userId) {
        return res.status(403).json({ error: "Session does not belong to current user" });
      }

      // Check payment status
      if (session.payment_status !== 'paid') {
        return res.status(400).json({ error: "Payment not completed", paymentStatus: session.payment_status });
      }

      // Verify it's a subscription
      if (session.mode !== 'subscription' || !session.subscription) {
        return res.status(400).json({ error: "Invalid session type" });
      }

      const plan = session.metadata?.plan as 'starter' | 'pro';
      if (!plan || (plan !== 'starter' && plan !== 'pro')) {
        return res.status(400).json({ error: "Invalid plan in session metadata" });
      }

      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price.id;

      if (!priceId) {
        return res.status(500).json({ error: "Price ID not found in subscription" });
      }

      // Activate subscription (idempotent)
      const updatedSubscription = await activateSubscription(userId, plan, subscription.id, priceId);

      res.json({
        success: true,
        subscription: updatedSubscription,
      });
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: "Failed to verify payment", details: error.message });
    }
  });

  // Stripe Webhook Handler - Process subscription lifecycle events
  app.post("/api/webhooks/stripe", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    if (!sig) {
      return res.status(400).json({ error: "No stripe-signature header" });
    }

    let event: Stripe.Event;

    try {
      // Use rawBody saved by express.json verify callback
      const rawBody = (req as any).rawBody;
      if (!rawBody) {
        throw new Error("Raw body not available");
      }
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    try {
      // Handle specific events
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log(`[Stripe Webhook] Checkout completed for session: ${session.id}`);

          if (session.mode === 'subscription' && session.subscription && session.customer) {
            const userId = parseInt(session.metadata?.userId || session.client_reference_id || '0');
            const plan = session.metadata?.plan as 'starter' | 'pro';

            if (!userId || !plan) {
              console.error('[Stripe Webhook] Missing userId or plan in session metadata');
              break;
            }

            // Get the subscription and price details
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            const priceId = subscription.items.data[0]?.price.id;

            if (!priceId) {
              console.error('[Stripe Webhook] No price ID found in subscription');
              break;
            }

            // Activate subscription using shared helper (idempotent)
            await activateSubscription(userId, plan, subscription.id, priceId);
          }
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as any; // Use any to handle Stripe API inconsistencies
          console.log(`[Stripe Webhook] Invoice paid: ${invoice.id}`);

          // Reset monthly credits on recurring invoice payment
          const subscriptionId = typeof invoice.subscription === 'string' 
            ? invoice.subscription 
            : invoice.subscription?.id || null;

          if (invoice.billing_reason === 'subscription_cycle' && subscriptionId) {
            const subscription = await storage.getSubscriptionByStripeId(subscriptionId);
            
            if (subscription) {
              const planDetails = PLAN_DETAILS[subscription.plan];
              const creditsInSeconds = planDetails.credits * 60;
              
              await storage.updateSubscription(subscription.userId, {
                creditsRemaining: creditsInSeconds,
                billingCycleStart: new Date(),
                billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              });

              console.log(`[Stripe Webhook] Reset credits for user ${subscription.userId}`);
            }
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`[Stripe Webhook] Subscription updated: ${subscription.id}`);

          const dbSubscription = await storage.getSubscriptionByStripeId(subscription.id);
          if (dbSubscription) {
            // Check if plan changed (upgrade/downgrade)
            const priceId = subscription.items.data[0]?.price.id;
            if (priceId !== dbSubscription.stripePriceId) {
              // Plan changed - determine new plan
              const newPlan = priceId === process.env.STRIPE_STARTER_PRICE_ID ? 'starter' 
                : priceId === process.env.STRIPE_PRO_PRICE_ID ? 'pro' 
                : dbSubscription.plan;

              if (newPlan !== dbSubscription.plan) {
                const planDetails = PLAN_DETAILS[newPlan];
                const creditsInSeconds = planDetails.credits * 60;

                await storage.updateSubscription(dbSubscription.userId, {
                  plan: newPlan,
                  creditsRemaining: creditsInSeconds,
                  stripePriceId: priceId,
                });

                console.log(`[Stripe Webhook] Plan changed to ${newPlan} for user ${dbSubscription.userId}`);
              }
            }
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`[Stripe Webhook] Subscription canceled: ${subscription.id}`);

          const dbSubscription = await storage.getSubscriptionByStripeId(subscription.id);
          if (dbSubscription) {
            // Downgrade to free tier with lifetime 60 minutes
            await storage.updateSubscription(dbSubscription.userId, {
              plan: 'free',
              creditsRemaining: 60 * 60, // 60 minutes in seconds
              billingCycleEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 years (lifetime)
            });

            await storage.clearSubscriptionStripeInfo(dbSubscription.userId);

            console.log(`[Stripe Webhook] Downgraded user ${dbSubscription.userId} to free tier`);
          }
          break;
        }

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }

      // Acknowledge receipt
      res.json({ received: true });
    } catch (error: any) {
      console.error(`[Stripe Webhook] Error processing event: ${error.message}`);
      res.status(500).json({ error: "Webhook handler failed", details: error.message });
    }
  });

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: any) => {
    const connectionStartTime = Date.now();
    console.log('[WebSocket] New connection established');
    
    // Store the HTTP request for session access
    (ws as any).upgradeReq = req;
    
    // Keep connection alive with ping/pong
    let isAlive = true;
    
    ws.on('pong', () => {
      isAlive = true;
    });

    const pingInterval = setInterval(() => {
      if (!isAlive) {
        clearInterval(pingInterval);
        return ws.terminate();
      }
      
      isAlive = false;
      ws.ping();
    }, 45000); // 45 seconds - aggressive protocol-level pings to prevent proxy timeout

    ws.on('message', async (data: Buffer) => {
      // ANY message from client proves connection is alive (fixes disconnection during heavy Azure operations)
      isAlive = true;
      
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join') {
          const { roomId, language, voiceGender, role } = message;
          
          if (!language) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Language is required'
            }));
            return;
          }
          
          if (!voiceGender) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Voice gender is required'
            }));
            return;
          }

          // Get authenticated userId from session (security: never trust client-supplied userId)
          const req = (ws as any).upgradeReq;
          const userId = await getUserIdFromWebSocketSession(req);

          // Only require authentication for room creators (they pay for credits)
          // Participants join as guests via invite link - no login required
          if (role === 'creator' && !userId) {
            ws.send(JSON.stringify({
              type: 'error',
              error: 'Authentication required',
              message: 'Please log in to create a translation session',
              requiresAuth: true
            }));
            ws.close();
            return;
          }
          
          // Note: Email verification temporarily disabled for testing
          // TODO: Re-enable email verification before production deployment
          
          const room = await storage.getRoom(roomId);
          if (!room) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Room not found'
            }));
            return;
          }

          connections.set(ws, { ws, roomId, language, voiceGender, role });
          
          if (!roomConnections.has(roomId)) {
            roomConnections.set(roomId, []);
          }
          roomConnections.get(roomId)?.push(ws);

          if (role === 'participant') {
            await storage.updateRoom(roomId, { 
              participantLanguage: language,
              participantVoiceGender: voiceGender 
            });
            
            console.log(`[Join] Participant joined with gender: ${voiceGender}`);
            console.log(`[Join] Sending creator's gender to participant: ${room.creatorVoiceGender}`);
            
            // Send creator's info to the participant
            ws.send(JSON.stringify({
              type: 'participant-joined',
              roomId,
              language: room.creatorLanguage,
              voiceGender: room.creatorVoiceGender
            }));
            
            console.log(`[Join] Sending participant's gender to creator: ${voiceGender}`);
            
            // Notify creator that participant joined
            const roomClients = roomConnections.get(roomId) || [];
            roomClients.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'participant-joined',
                  roomId,
                  language,
                  voiceGender
                }));
              }
            });

            // Start credit tracking session
            if (!activeSessions.has(roomId)) {
              console.log(`[Credit Tracking] Starting session for room ${roomId}`);
              const now = Date.now();
              
              // Get creator's subscription to send initial credit balance
              const creatorSubscription = await storage.getSubscription(room.userId);
              const initialCredits = creatorSubscription?.creditsRemaining || 0;
              
              // Start interval to deduct credits every 10 seconds
              const intervalId = setInterval(async () => {
                const session = activeSessions.get(roomId);
                if (!session || !session.isActive) {
                  clearInterval(intervalId);
                  return;
                }

                const now = Date.now();
                const elapsedSinceLastDeduction = Math.floor((now - session.lastDeductionTime) / 1000);
                
                if (elapsedSinceLastDeduction >= 10) {
                  // Deduct 10 seconds worth of credits using consumeCredits
                  const result = await storage.consumeCredits(room.userId, 10);
                  session.lastDeductionTime = now;
                  
                  console.log(`[Credit Tracking] Deducted 10 credits from user ${room.userId}. Remaining: ${result.creditsRemaining}`);
                  
                  // Broadcast credit update to all clients in the room
                  const clients = roomConnections.get(roomId) || [];
                  clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                      client.send(JSON.stringify({
                        type: 'credit-update',
                        creditsRemaining: result.creditsRemaining,
                        exhausted: result.exhausted
                      }));
                    }
                  });

                  // If credits exhausted, end the session for everyone
                  if (result.exhausted) {
                    console.log(`[Credit Tracking] Credits exhausted for room ${roomId}`);
                    endSession(roomId, 'credits-exhausted');
                  }
                }
              }, 10000); // Check every 10 seconds

              activeSessions.set(roomId, {
                roomId,
                userId: room.userId,
                startTime: now,
                lastDeductionTime: now,
                intervalId,
                isActive: true
              });

              // Send session-started event with initial credit balance
              roomClients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'session-started',
                    creditsRemaining: initialCredits
                  }));
                }
              });

              console.log(`[Credit Tracking] Session started with ${initialCredits} credits remaining`);
            }
          }
        }

        // Application-level ping/pong for keeping connection alive through proxies
        if (message.type === 'ping') {
          const connInfo = connections.get(ws);
          console.log(`[Heartbeat-Server] 💓 Received ping from client (role: ${connInfo?.role}, language: ${connInfo?.language}), sending pong`);
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        if (message.type === 'transcription') {
          const { roomId, text, language, interim } = message;
          const connection = connections.get(ws);
          
          if (!connection) return;

          try {
            if (!text || text.trim().length === 0) {
              return;
            }
            
            // Handle interim transcriptions (partial results)
            if (interim === true) {
              console.log(`[Transcription-Interim] Received text: "${text}", language: ${language}`);
              
              // Broadcast interim transcription directly without translation
              const roomClients = roomConnections.get(roomId) || [];
              roomClients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'transcription',
                    roomId,
                    text,
                    speaker: connection.role,
                    language,
                    interim: true
                  }));
                }
              });
              return;
            }
            
            // Handle final transcriptions (recognized speech)
            const transcriptionTimestamp = Date.now();
            console.log(`[Transcription-Final] ⏱️ Timestamp: ${transcriptionTimestamp}, Received text: "${text}", language: ${language}, speaker: ${connection.role}`);
            
            const room = await storage.getRoom(roomId);
            if (!room) return;

            const targetLanguage = connection.role === 'creator' 
              ? room.participantLanguage 
              : room.creatorLanguage;

            if (!targetLanguage) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Participant has not joined yet'
              }));
              return;
            }

            const translatedText = await translateText(text, language, targetLanguage);
            const translationCompleteTimestamp = Date.now();
            console.log(`[Translation] ⏱️ Translation completed in ${translationCompleteTimestamp - transcriptionTimestamp}ms: "${text}" → "${translatedText}"`);

            // SERVER-SIDE DEDUPLICATION: Create content-based stable key WITHOUT timestamp
            // This prevents Azure Speech SDK from triggering duplicate broadcasts if 'recognized' event fires twice
            // Use full text (not truncated) to avoid false positives from long messages with shared prefixes
            const dedupeKey = `${connection.role}|${text}|${translatedText}`;
            const now = Date.now();
            const DEDUPE_TTL_MS = 5000; // 5 second TTL: same content within 5s = duplicate, after 5s = legitimate repetition
            
            if (!broadcastedMessageIds.has(roomId)) {
              broadcastedMessageIds.set(roomId, new Map());
            }
            
            const roomMessageTracker = broadcastedMessageIds.get(roomId)!;
            
            // Clean up expired entries (older than TTL)
            const expiredKeys: string[] = [];
            roomMessageTracker.forEach((timestamp, key) => {
              if (now - timestamp > DEDUPE_TTL_MS) {
                expiredKeys.push(key);
              }
            });
            expiredKeys.forEach(key => roomMessageTracker.delete(key));
            if (expiredKeys.length > 0) {
              console.log(`[Server Deduplication] 🧹 Cleaned up ${expiredKeys.length} expired dedupe entries (TTL: ${DEDUPE_TTL_MS}ms)`);
            }
            
            // Check if this content was already broadcast within TTL window
            const lastBroadcastTime = roomMessageTracker.get(dedupeKey);
            if (lastBroadcastTime !== undefined) {
              const timeSinceLastBroadcast = now - lastBroadcastTime;
              console.warn(`[Server Deduplication] ⛔ DUPLICATE BROADCAST PREVENTED!`);
              console.warn(`[Server Deduplication] 📝 Text: "${text}" → "${translatedText}"`);
              console.warn(`[Server Deduplication] ⏱️ Last broadcast: ${timeSinceLastBroadcast}ms ago (TTL: ${DEDUPE_TTL_MS}ms)`);
              console.warn(`[Server Deduplication] 🔍 This likely means Azure Speech SDK fired the 'recognized' event twice for the same utterance`);
              return; // Don't broadcast again - this is a true duplicate from Azure
            }
            
            // Mark content as broadcast with current timestamp
            roomMessageTracker.set(dedupeKey, now);
            console.log(`[Server Deduplication] ✅ New content added to broadcast tracker. Room ${roomId} has ${roomMessageTracker.size} tracked messages`);
            
            // NOW generate unique messageId for client-side tracking (each broadcast gets unique ID)
            const messageId = `${connection.role}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            console.log(`[Server Deduplication] 🆔 Generated messageId: ${messageId} for content hash`);
            
            // Additional cleanup: cap total entries to prevent unbounded growth (should never hit this with TTL cleanup)
            if (roomMessageTracker.size > 200) {
              const entriesToDelete = Array.from(roomMessageTracker.entries())
                .sort((a, b) => a[1] - b[1]) // Sort by timestamp, oldest first
                .slice(0, 100) // Delete oldest 100
                .map(([key]) => key);
              
              entriesToDelete.forEach(key => roomMessageTracker.delete(key));
              console.log(`[Server Deduplication] 🧹 Emergency cleanup: removed ${entriesToDelete.length} oldest entries. New size: ${roomMessageTracker.size}`);
            }
            
            const roomClients = roomConnections.get(roomId) || [];
            console.log(`[Translation Broadcast] 📡 Broadcasting to ${roomClients.length} clients in room ${roomId}, messageId: ${messageId}`);
            
            let successfulBroadcasts = 0;
            roomClients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'translation',
                  roomId,
                  messageId,
                  originalText: text,
                  translatedText,
                  speaker: connection.role,
                  originalLanguage: language,
                  translatedLanguage: targetLanguage
                }));
                successfulBroadcasts++;
              }
            });
            
            const broadcastCompleteTimestamp = Date.now();
            console.log(`[Translation Broadcast] ✅ Successfully broadcast to ${successfulBroadcasts}/${roomClients.length} clients`);
            console.log(`[Translation Broadcast] ⏱️ Total time (transcription → translation → broadcast): ${broadcastCompleteTimestamp - transcriptionTimestamp}ms`);

          } catch (error) {
            console.error('[Transcription] Error processing text:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to process transcription'
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', (code: number, reason: Buffer) => {
      const duration = Math.floor((Date.now() - connectionStartTime) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const connection = connections.get(ws);
      
      // Close code descriptions
      const closeReasons: Record<number, string> = {
        1000: "Normal",
        1001: "Going Away",
        1006: "Abnormal (network/timeout)",
        1011: "Server Error"
      };
      
      const closeReason = closeReasons[code] || `Code ${code}`;
      
      // ALWAYS log ALL disconnects with full details
      console.log(`[WebSocket] 🔌 DISCONNECTED [${closeReason}]:`, {
        code,
        reason: reason.toString() || 'none',
        duration: `${minutes}m ${seconds}s (${duration}s)`,
        roomId: connection?.roomId || 'unknown',
        language: connection?.language || 'unknown',
        role: connection?.role || 'unknown',
        timestamp: new Date().toISOString()
      });
      
      clearInterval(pingInterval);
      
      if (connection) {
        const { roomId, role } = connection;
        
        // End the entire session when ANY user disconnects
        // This ensures the other user is notified and credits stop immediately
        const sessionReason = role === 'creator' ? 'creator-left' : 'participant-left';
        endSession(roomId, sessionReason);
        
        connections.delete(ws);
      }
    });

    ws.on('error', (error) => {
      const duration = Math.floor((Date.now() - connectionStartTime) / 1000);
      const connection = connections.get(ws);
      
      // ALWAYS log ALL errors with full context
      console.error('[WebSocket] ❌ ERROR:', {
        message: error.message,
        duration: `${duration}s`,
        roomId: connection?.roomId || 'unknown',
        role: connection?.role || 'unknown',
        timestamp: new Date().toISOString()
      });
      
      clearInterval(pingInterval);
    });
  });

  return httpServer;
}

async function translateText(text: string, fromLanguage: string, toLanguage: string): Promise<string> {
  try {
    const translatorKey = process.env.AZURE_TRANSLATOR_KEY;
    const translatorRegion = process.env.AZURE_TRANSLATOR_REGION;

    if (!translatorKey || !translatorRegion) {
      throw new Error('Azure Translator credentials not configured');
    }

    const response = await axios.post(
      'https://api.cognitive.microsofttranslator.com/translate',
      [{ text }],
      {
        headers: {
          'Ocp-Apim-Subscription-Key': translatorKey,
          'Ocp-Apim-Subscription-Region': translatorRegion,
          'Content-Type': 'application/json',
        },
        params: {
          'api-version': '3.0',
          from: fromLanguage,
          to: toLanguage,
        },
      }
    );

    if (response.data && response.data[0]?.translations?.[0]?.text) {
      return response.data[0].translations[0].text;
    } else {
      console.warn('Translation failed:', response.data);
      return text;
    }
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

function getAzureLanguageCode(code: string): string {
  const languageMap: Record<string, string> = {
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'pt': 'pt-PT',
    'ru': 'ru-RU',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'zh': 'zh-CN',
    'ar': 'ar-SA',
    'hi': 'hi-IN',
    'nl': 'nl-NL',
    'pl': 'pl-PL',
    'tr': 'tr-TR',
  };
  return languageMap[code] || code;
}
