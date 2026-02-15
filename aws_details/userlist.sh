#!/bin/bash

PASSWORD="TempleInfo@2025"
API="https://5cvv7zff4i.execute-api.us-east-1.amazonaws.com/prod/admin/create-user"

while IFS="|" read -r email name
do
  echo "Creating $email"

  curl -s -X POST "$API" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$email\",
      \"name\": \"$name\",
      \"tempPassword\": \"$PASSWORD\",
      \"group\": \"VOLUNTEER\",
      \"isPermanent\": true
    }"

  echo ""
done <<EOF
ramesh_kkd@yahoo.com|Ramesh Kumar
rameshnaidu1706@gmail.com|Ramesh
masireddy78@gmail.com|Masi Reddy
v_k_raju2003@yahoo.com|Kamaraju Vadrevu
iamram1984@gmail.com|Ramesh
rvkr.04@gmail.com|Ravi Atchi
venkattt@gmail.com|Venkat
swathifour@gmail.com|Swathi Chedurupally
bhaskarprave@gmail.com|Bhaskar Praveen Ramesh
sairamakrishna.karri@gmail.com|Sairamakrishna BuchiReddy Karri
gautam.nagaraj1@gmail.com|Gautam Nagaraj
venkatttt@gmail.com|Venkat
kumari.vec@gmail.com|Kumari Tamilselvan
EOF