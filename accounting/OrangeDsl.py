import requests

url = 'https://dsl.orange.eg/APIs/AccountSettings/api/DSLPackages/GetQuotaConsumption'
payload = {'Channel': 23,
'LandLine': "23586678",
'Language': "ar",
'ModuleName': 144,
'RequestID': "0c579510-510a-ac0f-256b-b45964c46d1e",
'UserName': "0223586678"}
header = {
'Host':'dsl.orange.eg',
'Origin':'https://dsl.orange.eg',
'Referer':'https://dsl.orange.eg/ar/myaccount/'
}

data = requests.post(url, data=payload, headers=header)
print(data)