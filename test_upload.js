const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const http = require('http');

const filePath = path.join(__dirname, 'sample.mp4');
const form = new FormData();
form.append('file', fs.createReadStream(filePath), 'sample.mp4');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/process',
    method: 'POST',
    headers: form.getHeaders()
};

console.log('Uploading sample.mp4 to RACIO...');
console.log('');

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('');
        try {
            const json = JSON.parse(data);
            console.log('Session ID:', json.sessionId);
            console.log('');
            console.log('ZIP Download:', json.zip);
            console.log('');
            console.log('Individual Files:');
            json.files.forEach(f => {
                console.log(`  - ${f.name}: ${f.url}`);
            });
        } catch (e) {
            console.log('Response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
});

form.pipe(req);
