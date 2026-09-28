import fs from 'fs';

async function test() {
    try {
        const resList = await fetch('https://crmautomatizap-digital.vercel.app/api/list_tenants');
        const list = await resList.json();
        console.log("List:");
        console.log(list);
        if (list.length > 0) {
            const id = list[0].id_empresa;
            console.log("Fetching details for:", id);
            const res = await fetch(`https://crmautomatizap-digital.vercel.app/api/get_tenant_details?id=${id}`);
            const text = await res.text();
            console.log("Details response:");
            console.log(text);
        }
    } catch(e) {
        console.log(e);
    }
}
test();
