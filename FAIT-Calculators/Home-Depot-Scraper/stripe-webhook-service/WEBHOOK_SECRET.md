# Getting Your Stripe Webhook Secret

This guide provides multiple methods to get your Stripe webhook secret.

## Method 1: Using the Stripe CLI Directly

The simplest method is to use the Stripe CLI directly:

```bash
# First, make sure you're logged in
stripe login

# Then run the listen command
stripe listen
```

Look for a line that says:
```
Ready! Your webhook signing secret is whsec_abc123... (^C to quit)
```

Copy the webhook secret (starts with `whsec_`) and add it to your `.env` file:
```
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

## Method 2: Using the Helper Scripts

We've created some helper scripts to simplify the process:

### Ultra-Simple Script

```bash
./get-secret.sh
```

This script just runs `stripe listen` and provides basic instructions.

### Update .env File

After you have your webhook secret, you can update your `.env` file with:

```bash
./update-env.sh
```

This script will:
1. Ask you to enter your webhook secret
2. Validate the format
3. Update your `.env` file

## Method 3: From the Stripe Dashboard

You can also get your webhook secret from the Stripe Dashboard:

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your webhook endpoint
3. Click "Reveal" next to "Signing secret"
4. Copy the secret and add it to your `.env` file

## Troubleshooting

### Stripe CLI Authentication Issues

If you're having trouble with the Stripe CLI:

1. Make sure you're logged in:
   ```bash
   stripe login
   ```

2. Check your Stripe CLI configuration:
   ```bash
   stripe config
   ```

3. Check which account you're using:
   ```bash
   stripe whoami
   ```

4. Try logging out and logging in again:
   ```bash
   stripe logout
   stripe login
   ```

### Environment Variable Issues

If your webhook is still not working after adding the secret:

1. Make sure the secret is correctly formatted in your `.env` file:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

2. Make sure your application is reading the environment variable correctly

3. Verify that the environment variable is being passed to your deployment:
   ```bash
   echo $STRIPE_WEBHOOK_SECRET
   ```
