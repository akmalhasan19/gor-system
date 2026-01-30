1. First, you need to create a Fixed Virtual Account. Creating a Fixed Virtual Account can be done through the POST Request to

POST https://api.xendit.co/callback_virtual_accounts

2. Use the parameter as below:

{
 "external_id": "ORDER-2020/123",
 "bank_code": "BRI",
 "name": "Gabriel"
}

3. When you've created the FVA, it will generate a response like below:

{
 "is_closed": false,
 "status": "PENDING",
 "currency": "IDR",
 "owner_id": "5cfcd42d1d99185891ab2cf3",
 "external_id": "ORDER-2020/123",
 "bank_code": "BRI",
 "merchant_code": "26215",
 "name": "Gabriel Partogi",
 "account_number": "262159999664888",
 "expected_amount": 3000000,
 "expiration_date": "2021-10-15T17:00:00.000Z",
 "is_single_use": true,
 "id": "5f96653de934517a5cb6842b"
}

4. Send a request to:

https://api.xendit.co/callback_virtual_accounts/{external_id=}/simulate_payment

5. From the previous request, you need to get the external ID from the request and input it in the endpoint between the dashes like below:

https://api.xendit.co/callback_virtual_accounts/external_id=ORDER-2020/123/simulate_payment

6. Add the amount to the body of the request:

{
    "amount": 100000
}

7. Afterward, you should receive the status as "COMPLETED" like below.

{
 "status": "COMPLETED",
 "message": "Payment for the Fixed VA with external id ORDER-1603691837 is currently being processed. Please ensure that you have set a callback URL for VA payments via Dashboard Settings and contact us if you do not receive a VA payment callback within the next 5 mins."
}