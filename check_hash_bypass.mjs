import('node:https').then(m => {
    const req = m.default.get('https://crmautomatizap-digital.vercel.app/admin.html?v=' + Date.now(), res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            const matches = data.match(/admin-[A-Za-z0-9_-]+\.js/g);
            console.log('Admin JS file on Vercel with bypass:', matches);
        });
    });
});
