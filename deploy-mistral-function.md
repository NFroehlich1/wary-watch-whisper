# 🚀 Mistral AI Edge Function Deployment Guide

## **Method 1: Supabase Dashboard (Recommended)**

### **Step 1: Access Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar

### **Step 2: Create the Function**
1. Click **"Create a new function"**
2. Function name: `mistral-ai`
3. Copy and paste the complete code from your `supabase/functions/mistral-ai/index.ts` file

### **Step 3: Set Environment Variables**
⚠️ **CRITICAL**: Before deploying, you MUST set the `MISTRAL_API_KEY`:

1. In your Supabase dashboard, go to **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name**: `MISTRAL_API_KEY`
   - **Value**: Your Mistral API key (get it from https://console.mistral.ai/)
   - **Scope**: Select **Edge Functions**
3. Click **Save**

### **Step 4: Deploy**
1. Click **Deploy** in the function editor
2. Wait for deployment to complete
3. You should see a success message

---

## **Method 2: Using Supabase CLI**

### **Install CLI**
```powershell
# Option 1: Using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Option 2: Download binary from GitHub releases
# https://github.com/supabase/cli/releases
```

### **Deploy with CLI**
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy mistral-ai

# Set environment variable
supabase secrets set MISTRAL_API_KEY=your_mistral_api_key_here
```

---

## **Step 5: Test the Deployment**

### **In your React app**
After deployment, test the function using the dropdown you created:

1. Open your app
2. Select "Mistral" from the dropdown
3. Click "Test API"
4. You should see "✅ Mistral API funktioniert: Mistral API-Schlüssel ist gültig"

### **Manual test via HTTP**
```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/mistral-ai' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"action": "verify-key"}'
```

---

## **Troubleshooting**

### **Common Issues:**

1. **"MISTRAL_API_KEY not found"**
   - Make sure you set the environment variable
   - Ensure the scope is set to "Edge Functions"
   - Redeploy the function after adding the key

2. **"Function not found"**
   - Check the function name is exactly `mistral-ai`
   - Verify the deployment completed successfully

3. **CORS Issues**
   - The function includes proper CORS headers
   - Make sure your domain is authorized in Supabase settings

4. **Mistral API Key Issues**
   - Get your API key from https://console.mistral.ai/
   - Ensure you have credits/quota available
   - Test the key directly with Mistral's API first

---

## **Next Steps**

After successful deployment:
1. ✅ The model selection dropdown in your app should work
2. ✅ Automatic fallback between Gemini and Mistral is active
3. ✅ All newsletter generation features work with both providers
4. ✅ Your app is now more resilient with dual LLM support

**Function URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/mistral-ai`

Remember to replace `YOUR_PROJECT_REF` with your actual Supabase project reference! 