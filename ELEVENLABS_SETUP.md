# Eleven Labs Text-to-Speech Integration

This application now supports high-quality text-to-speech functionality using Eleven Labs API via Supabase Edge Functions for reading out AI assistant responses in the newsletter Q&A system.

## Features

- **Manual TTS**: Click the "Vorlesen" button on any assistant message to have it read aloud
- **Automatic TTS**: Toggle "Auto-TTS" to automatically read new assistant responses
- **German Language Support**: Optimized for German text using Eleven Labs multilingual models
- **Smart Text Processing**: Automatically cleans markdown formatting for better speech output
- **Secure API Integration**: Uses Supabase Edge Functions with secure API key storage

## Setup Instructions

### 1. Get Eleven Labs API Key

1. Visit [Eleven Labs](https://elevenlabs.io/app/speech-synthesis)
2. Create an account or sign in
3. Navigate to your profile and copy your API key

### 2. Configure Supabase Edge Function Secret

**Add the API key as a Supabase secret:**

1. **Supabase Dashboard** → Your Project (`aggkhetcdjmggqjzelgd`)
2. **Settings** → **Environment Variables**
3. **Add new environment variable:**
   - **Name**: `ELEVEN-LABS-API-KEY`
   - **Value**: Your Eleven Labs API key
   - **Scope**: Edge Functions

### 3. Deploy Edge Function

The Edge Function `elevenlabs-tts` is already configured in your project. If you need to deploy it manually:

1. **Supabase Dashboard** → **Edge Functions**
2. Create or update function named `elevenlabs-tts`
3. Use the code from `supabase/functions/elevenlabs-tts/index.ts`

### 4. Available Voices

You can customize the voice by passing a different `voiceId` prop to the TTS component. Popular voice IDs include:

- **Rachel** (default): `21m00Tcm4TlvDq8ikWAM` - Calm, professional female voice
- **Domi**: `AZnzlk1XvdvUeBnXmlld` - Strong, confident female voice  
- **Fin**: `D38z5RcWu1voky8WS1ja` - Friendly male voice
- **Sarah**: `EXAVITQu4vr4xnSDxMaL` - Soft, warm female voice

You can find more voices at [Eleven Labs Voice Lab](https://elevenlabs.io/app/voice-lab).

## Usage

### In Newsletter Q&A Section

1. **Ask a question** in the "Fragen zum Newsletter" section
2. **Manual reading**: Click the "Vorlesen" button on any assistant response
3. **Automatic reading**: 
   - Click "Auto-TTS AUS" to enable automatic reading
   - The button will turn green and show "Auto-TTS AN"
   - New responses will be automatically read aloud
   - Click again to disable

### Technical Details

- Uses Eleven Labs' `eleven_multilingual_v2` model for German language support
- Automatically limits text length to 2500 characters per request
- Cleans markdown formatting for better speech synthesis
- Handles API rate limits and error states gracefully
- Provides visual feedback for loading and playback states

## Troubleshooting

### Common Issues

1. **"API Key not found" error**
   - Ensure `ELEVEN-LABS-API-KEY` is set in Supabase Environment Variables
   - Make sure the Edge Function has been deployed correctly

2. **"API Limit reached" error**
   - You've exceeded your Eleven Labs usage quota
   - Check your usage at [Eleven Labs Dashboard](https://elevenlabs.io/app/usage)

3. **Audio doesn't play**
   - Some browsers block autoplay - try clicking the manual play button first
   - Check browser console for detailed error messages

4. **Edge Function errors**
   - Check Supabase Dashboard → Edge Functions → Logs for detailed error messages
   - Ensure the function is deployed and the secret is correctly configured

5. **Poor audio quality**
   - Try adjusting voice settings in the Edge Function (`elevenlabs-tts/index.ts`)
   - Consider using a different voice ID

## API Costs

Eleven Labs charges per character processed. The application:
- Limits text to 2500 characters per request
- Only processes text when explicitly requested (manual or auto-play)
- Does not pre-generate audio for all messages

Monitor your usage in the [Eleven Labs Dashboard](https://elevenlabs.io/app/usage).

## Development

The TTS functionality is implemented in:
- `src/components/ElevenLabsTTS.tsx` - Main TTS component (uses Supabase Edge Function)
- `src/components/NewsletterAskAbout.tsx` - Integration with Q&A interface
- `supabase/functions/elevenlabs-tts/index.ts` - Edge Function handling TTS API calls

To customize voice settings, modify the `voice_settings` object in the Edge Function:

```typescript
voice_settings: {
  stability: 0.5,        // 0-1, higher = more stable
  similarity_boost: 0.75, // 0-1, higher = more similar to original voice
  style: 0.0,            // 0-1, style exaggeration
  use_speaker_boost: true // Enhance speaker characteristics
}
```

### Edge Function Actions

The `elevenlabs-tts` Edge Function supports these actions:

- `verify-key`: Test if the API key is valid
- `text-to-speech`: Convert text to speech audio 