#!/bin/bash

# スクレイピングテスト用スクリプト

URL="https://medicine.tamagokichi.com/lp/shiboranaito2/01chat/sp/?once=on&ad_code=IF350002&r_ad=gdn&argument=7sbPa3f6&dmai=lk_shibo2_pm_01&gad_source=1&gad_campaignid=20120660623&gbraid=0AAAAApQA5AfMByXxMXhHvVfx9p1npji5T&gclid=CjwKCAjw3rnCBhBxEiwArN0QE0DQqRZRMdeZW01dPvDgsnO3OWw6kjF_6t6878ldnwQjPPS7xECKLRoCYkwQAvD_BwE"

echo "スクレイピングテスト開始..."
echo "URL: $URL"
echo ""

# スクレイピングAPIをテスト
echo "=== スクレイピング結果 ==="
curl -X POST http://localhost:3000/api/scrape-with-delay \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$URL\"}" | jq .

echo ""
echo "=== 分析結果 ==="
# 分析APIをテスト
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$URL\"}" | jq .