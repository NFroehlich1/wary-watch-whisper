const { createClient } = require('@supabase/supabase-js');

// Konfiguration - Ändere diese Werte
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabaseConnection() {
    console.log('🧪 Supabase Connection & Edge Function Test');
    console.log('=' .repeat(50));
    
    // Test 1: Basic Connection
    console.log('\n1️⃣  Testing Basic Connection...');
    try {
        const { data, error } = await supabase.from('nonexistent_table').select('*').limit(1);
        if (error && error.code === 'PGRST116') {
            console.log('✅ Basic connection successful!');
        } else if (error) {
            console.log(`ℹ️  Connection established: ${error.message}`);
        } else {
            console.log('✅ Basic connection successful!');
        }
    } catch (error) {
        console.error('❌ Basic connection failed:', error.message);
        return;
    }
    
    // Test 2: Test elevenlabs-tts function
    console.log('\n2️⃣  Testing elevenlabs-tts function...');
    await testEdgeFunction('elevenlabs-tts');
    
    // Test 3: Test rapid-processor function
    console.log('\n3️⃣  Testing rapid-processor function...');
    await testEdgeFunction('rapid-processor');
    
    // Test 4: Test with different actions
    console.log('\n4️⃣  Testing different actions...');
    await testFunctionActions();
    
    console.log('\n' + '=' .repeat(50));
    console.log('🏁 Test completed!');
}

async function testEdgeFunction(functionName) {
    const testText = "Hallo, das ist ein Test für die Text-zu-Sprache Funktion.";
    
    try {
        console.log(`   Testing ${functionName}...`);
        
        const startTime = Date.now();
        const { data, error } = await supabase.functions.invoke(functionName, {
            body: { 
                action: 'text-to-speech',
                data: { 
                    text: testText,
                    voiceId: "21m00Tcm4TlvDq8ikWAM"
                }
            }
        });
        const duration = Date.now() - startTime;
        
        if (error) {
            console.error(`   ❌ ${functionName} failed:`);
            console.error(`      Error Code: ${error.code || 'Unknown'}`);
            console.error(`      Error Message: ${error.message}`);
            console.error(`      Status: ${error.status || 'Unknown'}`);
            console.error(`      Duration: ${duration}ms`);
            if (error.context) {
                console.error(`      Context: ${JSON.stringify(error.context, null, 2)}`);
            }
        } else if (data && data.error) {
            console.error(`   ❌ ${functionName} returned error:`);
            console.error(`      Returned Error: ${data.error}`);
            console.error(`      Duration: ${duration}ms`);
            console.error(`      Full Response: ${JSON.stringify(data, null, 2)}`);
        } else if (data && data.audioBase64) {
            console.log(`   ✅ ${functionName} successful!`);
            console.log(`      Audio Length: ${data.audioBase64.length} characters`);
            console.log(`      MIME Type: ${data.mimeType}`);
            console.log(`      Text Length: ${data.textLength}`);
            console.log(`      Duration: ${duration}ms`);
        } else {
            console.log(`   ℹ️  ${functionName} unexpected response:`);
            console.log(`      Duration: ${duration}ms`);
            console.log(`      Response: ${JSON.stringify(data, null, 2)}`);
        }
    } catch (error) {
        console.error(`   ❌ ${functionName} JavaScript error:`);
        console.error(`      Error: ${error.message}`);
        console.error(`      Stack: ${error.stack}`);
    }
}

async function testFunctionActions() {
    const functions = ['elevenlabs-tts', 'rapid-processor'];
    const actions = ['get-key', 'verify-key', 'text-to-speech'];
    
    for (const functionName of functions) {
        console.log(`   Testing ${functionName} with different actions:`);
        
        for (const action of actions) {
            try {
                const { data, error } = await supabase.functions.invoke(functionName, {
                    body: { 
                        action: action,
                        data: action === 'text-to-speech' ? { 
                            text: "Test",
                            voiceId: "21m00Tcm4TlvDq8ikWAM"
                        } : {}
                    }
                });
                
                if (error) {
                    console.log(`      ❌ ${action}: ${error.message}`);
                } else if (data && data.error) {
                    console.log(`      ❌ ${action}: ${data.error}`);
                } else {
                    console.log(`      ✅ ${action}: Success`);
                    if (action === 'get-key' && data.apiKey) {
                        console.log(`         API Key present: ${data.apiKey.substring(0, 10)}...`);
                    }
                }
            } catch (error) {
                console.log(`      ❌ ${action}: ${error.message}`);
            }
        }
        console.log('');
    }
}

// Environment check
function checkEnvironment() {
    console.log('🔧 Environment Check:');
    console.log(`   Supabase URL: ${SUPABASE_URL}`);
    console.log(`   API Key: ${SUPABASE_ANON_KEY.substring(0, 10)}...`);
    
    if (SUPABASE_URL === 'https://your-project.supabase.co') {
        console.log('⚠️  Please update SUPABASE_URL in the script!');
        return false;
    }
    
    if (SUPABASE_ANON_KEY === 'your-anon-key') {
        console.log('⚠️  Please update SUPABASE_ANON_KEY in the script!');
        return false;
    }
    
    return true;
}

// Run tests
if (checkEnvironment()) {
    testSupabaseConnection().catch(console.error);
} else {
    console.log('\n❌ Please configure the SUPABASE_URL and SUPABASE_ANON_KEY variables first!');
} 