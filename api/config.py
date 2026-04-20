import os

# Priority Weights for Scoring
PRIORITY_WEIGHTS = {
    "price": 100,
    "brand": 90,
    "bodyType": 80,
    "fuel": 120,  # Increased weight - fuel type is a critical preference
    "transmission": 100,  # High weight for transmission preference
    "safetyRating": 60,
    "seating": 50,
    "mileage": 40,
    "service": 30,
    "luggage": 20
}

# The car data inventory
INDIAN_CARS = [
    {
        "id": "swift-vxi",
        "name": "Maruti Suzuki Swift",
        "company": "Maruti Suzuki",
        "model": "Swift",
        "transmission": "Manual",
        "fuel": "Petrol",
        "mileageCity": 17.2,
        "mileageHighway": 22.4,
        "safetyRating": 2,
        "priceLakh": 6.49,
        "reviewsScore": 4.6,
        "bodyType": "Hatchback",
        "postPurchaseServiceScore": 8.9,
        "launchYear": 2024,
        "seating": 5,
        "luggageLitres": 268
    },
    {
        "id": "baleno-alpha",
        "name": "Maruti Suzuki Baleno Alpha",
        "company": "Maruti Suzuki",
        "model": "Baleno",
        "transmission": "Automatic",
        "fuel": "Petrol",
        "mileageCity": 16.8,
        "mileageHighway": 22.9,
        "safetyRating": 0,
        "priceLakh": 9.28,
        "reviewsScore": 4.5,
        "bodyType": "Hatchback",
        "postPurchaseServiceScore": 8.8,
        "launchYear": 2022,
        "seating": 5,
        "luggageLitres": 318
    },
    {
        "id": "creta-sx",
        "name": "Hyundai Creta SX(O)",
        "company": "Hyundai",
        "model": "Creta",
        "transmission": "Automatic",
        "fuel": "Petrol",
        "mileageCity": 13.1,
        "mileageHighway": 17.4,
        "safetyRating": 3,
        "priceLakh": 18.99,
        "reviewsScore": 4.7,
        "bodyType": "SUV",
        "postPurchaseServiceScore": 8.4,
        "launchYear": 2024,
        "seating": 5,
        "luggageLitres": 433
    },
    {
        "id": "nexon-ev-max",
        "name": "Tata Nexon EV Max",
        "company": "Tata",
        "model": "Nexon EV",
        "transmission": "Automatic",
        "fuel": "EV",
        "mileageCity": 6.2,
        "mileageHighway": 6.8,
        "safetyRating": 5,
        "priceLakh": 19.54,
        "reviewsScore": 4.4,
        "bodyType": "SUV",
        "postPurchaseServiceScore": 7.9,
        "launchYear": 2023,
        "seating": 5,
        "luggageLitres": 350
    },
    {
        "id": "scorpio-n-z8",
        "name": "Mahindra Scorpio-N Z8",
        "company": "Mahindra",
        "model": "Scorpio-N",
        "transmission": "Manual",
        "fuel": "Diesel",
        "mileageCity": 12.4,
        "mileageHighway": 16.8,
        "safetyRating": 5,
        "priceLakh": 21.45,
        "reviewsScore": 4.8,
        "bodyType": "SUV",
        "postPurchaseServiceScore": 7.6,
        "launchYear": 2022,
        "seating": 7,
        "luggageLitres": 460
    },
    {
        "id": "city-vx",
        "name": "Honda City VX CVT",
        "company": "Honda",
        "model": "City",
        "transmission": "Automatic",
        "fuel": "Petrol",
        "mileageCity": 14.3,
        "mileageHighway": 18.4,
        "safetyRating": 4,
        "priceLakh": 14.82,
        "reviewsScore": 4.7,
        "bodyType": "Sedan",
        "postPurchaseServiceScore": 8.6,
        "launchYear": 2023,
        "seating": 5,
        "luggageLitres": 506
    },
    {
        "id": "innova-hycross-vx",
        "name": "Toyota Innova HyCross VX",
        "company": "Toyota",
        "model": "Innova HyCross",
        "transmission": "Automatic",
        "fuel": "Hybrid",
        "mileageCity": 18.5,
        "mileageHighway": 23.1,
        "safetyRating": 5,
        "priceLakh": 28.33,
        "reviewsScore": 4.9,
        "bodyType": "MPV",
        "postPurchaseServiceScore": 9.2,
        "launchYear": 2023,
        "seating": 7,
        "luggageLitres": 239
    },
    {
        "id": "zs-ev-excite",
        "name": "MG ZS EV Excite",
        "company": "MG",
        "model": "ZS EV",
        "transmission": "Automatic",
        "fuel": "EV",
        "mileageCity": 7.8,
        "mileageHighway": 8.4,
        "safetyRating": 5,
        "priceLakh": 22.88,
        "reviewsScore": 4.3,
        "bodyType": "SUV",
        "postPurchaseServiceScore": 7.8,
        "launchYear": 2024,
        "seating": 5,
        "luggageLitres": 470
    },
    {
        "id": "tiago-cng-xz",
        "name": "Tata Tiago iCNG XZ+",
        "company": "Tata",
        "model": "Tiago",
        "transmission": "Manual",
        "fuel": "CNG",
        "mileageCity": 19.2,
        "mileageHighway": 26.4,
        "safetyRating": 4,
        "priceLakh": 8.15,
        "reviewsScore": 4.4,
        "bodyType": "Hatchback",
        "postPurchaseServiceScore": 8.0,
        "launchYear": 2023,
        "seating": 5,
        "luggageLitres": 242
    },
    {
        "id": "seltos-gtx",
        "name": "Kia Seltos GTX+",
        "company": "Kia",
        "model": "Seltos",
        "transmission": "Automatic",
        "fuel": "Diesel",
        "mileageCity": 14.6,
        "mileageHighway": 18.2,
        "safetyRating": 3,
        "priceLakh": 20.15,
        "reviewsScore": 4.6,
        "bodyType": "SUV",
        "postPurchaseServiceScore": 8.2,
        "launchYear": 2024,
        "seating": 5,
        "luggageLitres": 433
    },
    {
        "id": "fronx-turbo",
        "name": "Maruti Suzuki Fronx Turbo BoosterJet",
        "company": "Maruti Suzuki",
        "model": "Fronx",
        "transmission": "Automatic",
        "fuel": "Petrol",
        "mileageCity": 15.9,
        "mileageHighway": 21.5,
        "safetyRating": 0,
        "priceLakh": 12.87,
        "reviewsScore": 4.5,
        "bodyType": "Coupe SUV",
        "postPurchaseServiceScore": 8.7,
        "launchYear": 2023,
        "seating": 5,
        "luggageLitres": 308
    },
    {
        "id": "slavia-style",
        "name": "Skoda Slavia Style",
        "company": "Skoda",
        "model": "Skoda",
        "transmission": "Automatic",
        "fuel": "Petrol",
        "mileageCity": 14.1,
        "mileageHighway": 18.7,
        "safetyRating": 5,
        "priceLakh": 18.69,
        "reviewsScore": 4.6,
        "bodyType": "Sedan",
        "postPurchaseServiceScore": 7.4,
        "launchYear": 2022,
        "seating": 5,
        "luggageLitres": 521
    },
    {
        "id": "virtus-gt",
        "name": "Volkswagen Virtus GT Plus",
        "company": "Volkswagen",
        "model": "Volkswagen",
        "transmission": "Automatic",
        "fuel": "Petrol",
        "mileageCity": 13.8,
        "mileageHighway": 18.2,
        "safetyRating": 5,
        "priceLakh": 19.42,
        "reviewsScore": 4.5,
        "bodyType": "Sedan",
        "postPurchaseServiceScore": 7.2,
        "launchYear": 2022,
        "seating": 5,
        "luggageLitres": 521
    },
    {
        "id": "harrier-plus",
        "name": "Tata Harrier Plus",
        "company": "Tata",
        "model": "Harrier",
        "transmission": "Automatic",
        "fuel": "Diesel",
        "mileageCity": 12.9,
        "mileageHighway": 16.8,
        "safetyRating": 5,
        "priceLakh": 26.44,
        "reviewsScore": 4.6,
        "bodyType": "SUV",
        "postPurchaseServiceScore": 7.8,
        "launchYear": 2024,
        "seating": 5,
        "luggageLitres": 445
    },
    {
        "id": "verna-turbo-dct",
        "name": "Hyundai Verna Turbo DCT",
        "company": "Hyundai",
        "model": "Verna",
        "transmission": "Automatic",
        "fuel": "Petrol",
        "mileageCity": 14.6,
        "mileageHighway": 18.8,
        "safetyRating": 5,
        "priceLakh": 17.38,
        "reviewsScore": 4.5,
        "bodyType": "Sedan",
        "postPurchaseServiceScore": 8.3,
        "launchYear": 2023,
        "seating": 5,
        "luggageLitres": 528
    },
    {
        "id": "ertiga-cng-zxi",
        "name": "Maruti Suzuki Ertiga ZXi+ CNG",
        "company": "Maruti Suzuki",
        "model": "Ertiga",
        "transmission": "Manual",
        "fuel": "CNG",
        "mileageCity": 17.5,
        "mileageHighway": 24.1,
        "safetyRating": 0,
        "priceLakh": 12.55,
        "reviewsScore": 4.5,
        "bodyType": "MPV",
        "postPurchaseServiceScore": 8.6,
        "launchYear": 2024,
        "seating": 7,
        "luggageLitres": 209
    },
    {
        "id": "atto3",
        "name": "BYD Atto 3",
        "company": "BYD",
        "model": "Atto 3",
        "transmission": "Automatic",
        "fuel": "EV",
        "mileageCity": 7.1,
        "mileageHighway": 7.6,
        "safetyRating": 5,
        "priceLakh": 33.99,
        "reviewsScore": 4.2,
        "bodyType": "SUV",
        "postPurchaseServiceScore": 7.5,
        "launchYear": 2023,
        "seating": 5,
        "luggageLitres": 440
    },
    {
        "id": "kwid-climber",
        "name": "Renault Kwid Climber AMT",
        "company": "Renault",
        "model": "Kwid",
        "transmission": "Automatic",
        "fuel": "Petrol",
        "mileageCity": 19.8,
        "mileageHighway": 22.3,
        "safetyRating": 1,
        "priceLakh": 5.99,
        "reviewsScore": 4.1,
        "bodyType": "Hatchback",
        "postPurchaseServiceScore": 7.1,
        "launchYear": 2023,
        "seating": 5,
        "luggageLitres": 279
    },
    {
        "id": "grand-vitara-hybrid",
        "name": "Maruti Suzuki Grand Vitara Alpha+ Hybrid",
        "company": "Maruti Suzuki",
        "model": "Grand Vitara",
        "transmission": "Automatic",
        "fuel": "Hybrid",
        "mileageCity": 20.6,
        "mileageHighway": 27.9,
        "safetyRating": 0,
        "priceLakh": 19.95,
        "reviewsScore": 4.6,
        "bodyType": "SUV",
        "postPurchaseServiceScore": 8.5,
        "launchYear": 2024,
        "seating": 5,
        "luggageLitres": 373
    },
    {
        "id": "xuv700-ax7",
        "name": "Mahindra XUV700 AX7",
        "company": "Mahindra",
        "model": "XUV700",
        "transmission": "Automatic",
        "fuel": "Diesel",
        "mileageCity": 12.1,
        "mileageHighway": 16.0,
        "safetyRating": 5,
        "priceLakh": 26.8,
        "reviewsScore": 4.7,
        "bodyType": "SUV",
        "postPurchaseServiceScore": 7.7,
        "launchYear": 2024,
        "seating": 7,
        "luggageLitres": 240
    }
]

SYSTEM_PROMPT = """You are a profile-aware assistant for BharatMotors. Help Indian buyers find the perfect car by profiling them intelligently.

CURRENT USER PROFILE:
{user_profile}

INVENTORY PREVIEW (Scored top matches):
{inventory_json}

INSTRUCTIONS:
1. DIALOG FLOW: Ask about Budget, Body Type, Brand, Primary Use, Fuel, Seating Max, and Mileage Priority.
2. NATURAL LANGUAGE: Understand complex input like "I want a 15L Tata SUV" and extract all fields at once.
3. EXCLUSIONS: If the user says "dont show Maruti" or "no Tata", add these to `excluded_brands`.
   !!! DO NOT suggest negative constraints like "No Maruti" as clickable pills. Only process them if the user types them.
4. BUDGET RANGES: Extract both `budget_min_lakh` and `budget_max_lakh`.
   - If they say "10-20 Lakhs", set `budget_min_lakh` to 10 and `budget_max_lakh` to 20.
   - If they click "Under 10", set max to 10. If "Over 20", set min to 20.
5. PILLS: ALWAYS provide clickable pills for the current question's answers.
   - !!! ALWAYS include a "Skip preference" pill in every response so the user can bypass any question.
   - !!! ALWAYS include a "🔄 Restart Chat" pill.
6. SKIP STEPS: If info is already provided, move to the next missing preference.

OUTPUT FORMAT:
Provide your conversational response, then the JSON block:
```json
{
  "profile_update": {
    "budget_min_lakh": number,
    "budget_max_lakh": number,
    "preferred_brands": ["Brand1", ...],
    "excluded_brands": ["BrandX", ...],
    "preferred_body_types": ["SUV", ...],
    "preferred_fuel": ["Petrol", ...],
    "primary_use": "City"|"Highway",
    "seating_max": number,
    "mileage_priority": true/false
  },
  "interactive_options": [
    { "label": "label", "value": "val", "type": "text"|"car"|"search"|"restart" },
    { "label": "Skip preference", "value": "Skip preference", "type": "text" },
    { "label": "🔄 Restart Chat", "value": "restart_chat", "type": "restart" }
  ],
  "show_skip": false
}
```
"""
