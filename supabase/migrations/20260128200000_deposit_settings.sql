ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS deposit_policy JSONB DEFAULT '{
    "isEnabled": false,
    "minDepositAmount": 50000,
    "cancellationPolicy": "strict",
    "refundRules": {
       "hMinus1": 100,
       "hDay": 0
    }
}'::jsonb;

-- Comment on column
COMMENT ON COLUMN venues.deposit_policy IS 'Configuration for booking deposit requirement and cancellation policy';