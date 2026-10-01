import { fetchLeads } from './data.js';

async function run() {
    try {
        const leads = await fetchLeads();
        console.log('Leads fetched:', leads);
    } catch(err) {
        console.error('Error fetching leads:', err);
    }
}
run();
