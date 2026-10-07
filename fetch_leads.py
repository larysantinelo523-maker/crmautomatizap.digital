import requests
import json

url = "https://qosgrqdfeqzxnzhmwomv.supabase.co/rest/v1/leads"
headers = {
    "apikey": "sb_publishable_zoJXnL-UHMj20tx_ml0O7A_tXG29lOZ",
    "Authorization": "Bearer sb_publishable_zoJXnL-UHMj20tx_ml0O7A_tXG29lOZ"
}

response = requests.get(url, headers=headers)
print("Leads:", json.dumps(response.json(), indent=2))
