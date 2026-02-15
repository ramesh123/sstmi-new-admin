aws lambda invoke \
    --function-name temple_transactions_normalizer \
    --cli-binary-format raw-in-base64-out \
    --payload '{"force_update": true}' \
    response1.json

aws lambda invoke \
    --function-name sstmi-transactions-dyanmo-s3-v2-migration \
    --cli-binary-format raw-in-base64-out \
    --payload '{}' \
    response2.json

