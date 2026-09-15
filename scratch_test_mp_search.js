const { MercadoPagoConfig, Payment } = require('mercadopago');

async function testSearch() {
    try {
        const client = new MercadoPagoConfig({ 
            accessToken: 'APP_USR-5121029731142512-091416-44ec7bdf36a55ab8f244f0d84bebbf11-1370822621' 
        });
        const payment = new Payment(client);
        
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
        
        console.log("Pesquisando pagamentos...");
        console.log(firstDay, lastDay);
        
        const searchResult = await payment.search({
            options: {
                begin_date: firstDay,
                end_date: lastDay,
                status: 'approved'
            }
        });
        
        let faturamento = 0;
        if (searchResult && searchResult.results) {
            searchResult.results.forEach(p => {
                faturamento += p.transaction_amount;
            });
        }
        console.log("Faturamento:", faturamento);
    } catch (e) {
        console.error("Erro", e);
    }
}
testSearch();
