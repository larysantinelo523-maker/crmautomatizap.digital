async function getBalance() {
    try {
        const token = 'APP_USR-5121029731142512-091416-44ec7bdf36a55ab8f244f0d84bebbf11-1370822621';
        // Need to get user ID first or directly hit balance endpoint?
        // MP API does not have a simple v1/balance endpoint without user_id? Actually let's try https://api.mercadopago.com/v1/balance
        // wait, let's try fetch API.
        const res = await fetch('https://api.mercadopago.com/users/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const user = await res.json();
        console.log("User:", user.id);
        
        // now get balance
        // there is no official public balance API for standard users in MP documentation easily found, but let's try:
        // /users/{user_id}/mercadopago_account/balance
        if (user.id) {
            const res2 = await fetch(`https://api.mercadopago.com/users/${user.id}/mercadopago_account/balance`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Balance status:", res2.status);
            const balance = await res2.json();
            console.log("Balance:", balance);
        }
    } catch(e) {
        console.error(e);
    }
}
getBalance();
