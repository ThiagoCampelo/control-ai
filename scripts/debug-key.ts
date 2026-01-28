
const url = 'https://kwpaeicypkhkfbbqzzop.supabase.co/auth/v1/admin/users';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3cGFlaWN5cGtoa2ZiYnF6em9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ2MTI0NywiZXhwIjoyMDg1MDM3MjQ3fQ.OvZ2aHt17TAxdIgldgOGoE2_asmpu4OmEsmg0-zezUYtl2';

async function test() {
    console.log('Testing URL:', url);
    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body Preview:', text.substring(0, 200));
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

test();
