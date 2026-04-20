import os
import sys
import json
import tempfile
import re
from typing import List, Optional, Dict, Any

# Ensure Vercel can find the local config.py file
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from config import INDIAN_CARS, PRIORITY_WEIGHTS

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use system temp directory for profiles to support Vercel's read-only filesystem
PROFILES_FILE = os.path.join(tempfile.gettempdir(), "profiles.json")

class UserProfileData(BaseModel):
    budget_min_lakh: Optional[float] = None
    budget_max_lakh: Optional[float] = None
    preferred_brands: List[str] = []
    excluded_brands: List[str] = []
    preferred_body_types: List[str] = []
    preferred_fuel: List[str] = []
    transmission_pref: Optional[str] = None
    primary_use: Optional[str] = None
    seating_max: Optional[int] = None
    mileage_priority: bool = False
    extra_focus: Optional[str] = None
    turn_count: int = 0
    dialog_step: int = 0
    answered_steps: List[int] = []  # Track which steps have been answered

class ProfileManager:
    @staticmethod
    def load_profiles() -> Dict[str, dict]:
        if not os.path.exists(PROFILES_FILE):
            return {}
        try:
            with open(PROFILES_FILE, "r") as f:
                return json.load(f)
        except:
            return {}

    @staticmethod
    def save_profile(user_id: str, profile: dict):
        profiles = ProfileManager.load_profiles()
        profiles[user_id] = profile
        with open(PROFILES_FILE, "w") as f:
            json.dump(profiles, f, indent=2)

    @staticmethod
    def get_profile(user_id: str) -> dict:
        profiles = ProfileManager.load_profiles()
        return profiles.get(user_id, UserProfileData().dict())

class CarScorer:
    @staticmethod
    def score_cars(profile: dict) -> List[dict]:
        scored_inventory = []
        budget_min = profile.get("budget_min_lakh")
        budget_max = profile.get("budget_max_lakh")
        excluded_brands = profile.get("excluded_brands", [])
        
        for car in INDIAN_CARS:
            price = car["priceLakh"]

            # HARD FILTER: Exclude brands that user explicitly excluded
            if excluded_brands:
                if any(brand.lower() in car["company"].lower() for brand in excluded_brands):
                    continue  # Skip excluded brands

            # HARD FILTER: Budget range with 10% tolerance
            if budget_max is not None:
                max_allowed = budget_max * 1.1  # 10% tolerance above
                if price > max_allowed:
                    continue  # Skip cars over budget
            
            if budget_min is not None:
                min_allowed = budget_min * 0.9  # 10% tolerance below
                if price < min_allowed:
                    continue  # Skip cars under minimum
            
            score = 0

            # Budget scoring - cars within range get full points
            if budget_min is not None and budget_max is not None:
                if budget_min <= price <= budget_max:
                    score += PRIORITY_WEIGHTS["price"]
                else:
                    # Slight penalty for tolerance zone but still in range
                    score += max(0, PRIORITY_WEIGHTS["price"] * 0.8)
            elif budget_max:
                if price <= budget_max:
                    score += PRIORITY_WEIGHTS["price"]
                else:
                    score += max(0, PRIORITY_WEIGHTS["price"] * 0.8)
            elif budget_min:
                if price >= budget_min:
                    score += PRIORITY_WEIGHTS["price"]
                else:
                    score += max(0, PRIORITY_WEIGHTS["price"] * 0.8)

            if profile.get("preferred_brands"):
                if any(brand.lower() in car["company"].lower() for brand in profile["preferred_brands"]):
                    score += PRIORITY_WEIGHTS["brand"]

            if profile.get("preferred_body_types"):
                if any(bt.lower() in car["bodyType"].lower() for bt in profile["preferred_body_types"]):
                    score += PRIORITY_WEIGHTS["bodyType"]

            usage = profile.get("primary_use")
            if usage == "City":
                score += (car["mileageCity"] / 22) * 40
            elif usage == "Highway":
                score += (car["mileageHighway"] / 28) * 40
                score += (car["safetyRating"] / 5) * 30

            if profile.get("preferred_fuel"):
                if any(f.lower() in car["fuel"].lower() for f in profile["preferred_fuel"]):
                    score += PRIORITY_WEIGHTS["fuel"]

            if profile.get("transmission_pref"):
                if car["transmission"].lower() == profile["transmission_pref"].lower():
                    score += PRIORITY_WEIGHTS["transmission"]

            if car["safetyRating"] >= 4:
                score += PRIORITY_WEIGHTS["safetyRating"]
            else:
                score += (car["safetyRating"] / 5) * PRIORITY_WEIGHTS["safetyRating"]

            s_max = profile.get("seating_max")
            if s_max:
                if car["seating"] > s_max:
                    score -= 50
                elif car["seating"] == s_max:
                    score += PRIORITY_WEIGHTS["seating"]
                else:
                    score += (car["seating"] / s_max) * 30

            if profile.get("mileage_priority"):
                avg_mileage = (car["mileageCity"] + car["mileageHighway"]) / 2
                score += (avg_mileage / 25) * PRIORITY_WEIGHTS["mileage"]

            score += (car["postPurchaseServiceScore"] / 10) * PRIORITY_WEIGHTS["service"]
            score += (car["luggageLitres"] / 600) * PRIORITY_WEIGHTS["luggage"]

            extra_focus = profile.get("extra_focus")
            if extra_focus == "Luggage":
                score += (car["luggageLitres"] / 600) * 20
            elif extra_focus == "Safety":
                score += (car["safetyRating"] / 5) * 20
            elif extra_focus == "Launch Year":
                score += max(0, car["launchYear"] - 2018) * 2
            elif extra_focus == "Transmission" and car["transmission"] == "Automatic":
                score += 20

            scored_inventory.append({**car, "ai_score": round(score, 2)})

        return sorted(scored_inventory, key=lambda x: x["ai_score"], reverse=True)

BODY_TYPES = ["Hatchback", "Sedan", "SUV", "MPV", "Coupe SUV"]
FUEL_TYPES = ["Petrol", "Diesel", "EV", "CNG", "Hybrid"]
SEATING_OPTIONS = [2, 4, 5, 7, 9]
PRIMARY_USE_OPTIONS = ["City", "Highway"]
EXTRA_FOCUS_OPTIONS = ["Luggage", "Safety", "Launch Year", "Transmission", "No extra preference"]


def normalize_profile(profile: dict) -> dict:
    return {
        "budget_min_lakh": profile.get("budget_min_lakh"),
        "budget_max_lakh": profile.get("budget_max_lakh"),
        "preferred_brands": profile.get("preferred_brands", []),
        "excluded_brands": profile.get("excluded_brands", []),
        "preferred_body_types": profile.get("preferred_body_types", []),
        "preferred_fuel": profile.get("preferred_fuel", []),
        "transmission_pref": profile.get("transmission_pref"),
        "primary_use": profile.get("primary_use"),
        "seating_max": profile.get("seating_max"),
        "mileage_priority": profile.get("mileage_priority", False),
        "extra_focus": profile.get("extra_focus"),
        "turn_count": profile.get("turn_count", 0),
        "dialog_step": profile.get("dialog_step", 0),
        "answered_steps": profile.get("answered_steps", []),
    }


def get_next_unanswered_step(profile: dict, current_step: int) -> int:
    """Find the next step that hasn't been answered yet."""
    answered = set(profile.get("answered_steps", []))
    for step in range(current_step + 1, 7):  # Steps 0-6 can be skipped if answered
        if step not in answered:
            return step
    return 7  # Move to recommendations question


def extract_all_preferences(message: str, profile: dict) -> None:
    """Extract all possible preferences from a single message (used for step 0)."""
    answered = set(profile.get("answered_steps", []))
    
    # Extract budget
    budget = parse_budget(message)
    if budget:
        profile["budget_min_lakh"] = budget[0]
        profile["budget_max_lakh"] = budget[1]
        answered.add(0)
    
    # Extract fuel type
    fuel = parse_fuel(message)
    if fuel:
        profile["preferred_fuel"] = fuel
        answered.add(4)  # Mark fuel step as answered
    
    # Extract body types
    body_types = parse_body_types(message)
    if body_types:
        profile["preferred_body_types"] = body_types
        answered.add(1)  # Mark body type step as answered
    
    # Extract preferred brands
    brands = parse_brands(message)
    if brands:
        profile["preferred_brands"] = brands
        answered.add(2)  # Mark brands step as answered
    
    # Extract excluded brands
    excluded_brands = parse_excluded_brands(message)
    if excluded_brands:
        profile["excluded_brands"] = excluded_brands
        answered.add(2)  # Mark brands step as answered
    
    # Extract transmission
    transmission = parse_transmission(message)
    if transmission:
        profile["transmission_pref"] = transmission
        answered.add(6)  # Transmission is step 6
    
    profile["answered_steps"] = list(answered)


def build_options_for_step(step: int) -> List[Dict[str, Any]]:
    if step == 0:
        options = [
            {"label": "Under 10 Lakhs", "value": "0-10", "type": "text"},
            {"label": "10 - 20 Lakhs", "value": "10-20", "type": "text"},
            {"label": "Over 20 Lakhs", "value": "20+", "type": "text"},
        ]
    elif step == 1:
        options = [{"label": bt, "value": bt, "type": "text"} for bt in BODY_TYPES]
    elif step == 2:
        brands = sorted({car["company"] for car in INDIAN_CARS})
        options = [{"label": brand, "value": brand, "type": "text"} for brand in brands]
    elif step == 3:
        options = [{"label": use, "value": use, "type": "text"} for use in PRIMARY_USE_OPTIONS]
    elif step == 4:
        options = [{"label": fuel, "value": fuel, "type": "text"} for fuel in FUEL_TYPES]
    elif step == 5:
        options = [{"label": str(value), "value": str(value), "type": "text"} for value in SEATING_OPTIONS]
    elif step == 6:
        options = [
            {"label": "Automatic", "value": "Automatic", "type": "text"},
            {"label": "Manual", "value": "Manual", "type": "text"},
        ]
    elif step == 7:
        options = [
            {"label": "Yes", "value": "Yes", "type": "text"},
            {"label": "No", "value": "No", "type": "text"},
        ]
    elif step == 8:
        options = [
            {"label": "Show recommendations", "value": "yes", "type": "text"},
            {"label": "Answer more questions", "value": "no", "type": "text"},
        ]
    elif step == 9:
        options = [{"label": focus, "value": focus, "type": "text"} for focus in EXTRA_FOCUS_OPTIONS]
    elif step == 10:
        options = [
            {"label": "Yes, answer more questions", "value": "yes", "type": "text"},
            {"label": "No, show final recommendations", "value": "no", "type": "text"},
        ]
    else:
        options = []

    if step <= 7:
        options.append({"label": "Skip preference", "value": "Skip preference", "type": "text"})
    options.append({"label": "Restart chat", "value": "restart_chat", "type": "restart"})
    return options


def build_question_for_step(step: int) -> str:
    if step == 0:
        return "What is your approximate budget in lakhs?"
    if step == 1:
        return "What body type are you looking for?"
    if step == 2:
        return "Do you have any preferred car brands?"
    if step == 3:
        return "Where will the car be used primarily?"
    if step == 4:
        return "Which fuel type do you prefer?"
    if step == 5:
        return "What is the maximum number of seats you need?"
    if step == 6:
        return "Do you prefer Automatic or Manual transmission?"
    if step == 7:
        return "Do you want the car to prioritize mileage?"
    if step == 8:
        return "I have enough information. Would you like to see recommendations now or answer a few more questions?"
    if step == 9:
        return "Which extra preference should I prioritize?"
    if step == 10:
        return "Would you like to answer more questions for better recommendations?"
    return ""


def parse_budget(message: str) -> Optional[tuple]:
    """Returns (budget_min, budget_max) or None. Handles natural language input."""
    text = message.strip().lower()
    if "skip" in text:
        return None
    
    # Direct pattern matching for the specific options
    if text == "0-10":
        return (0.0, 10.0)
    if text == "10-20" or text == "10 - 20":
        return (10.0, 20.0)
    if text == "20+" or text == "20 +":
        return (20.0, 1000.0)
    
    # Handle more flexible range format like "10-20" or "20+"
    if "-" in text and not text.startswith("-"):
        parts = text.split("-")
        if len(parts) == 2:
            try:
                min_val = float(parts[0].strip())
                max_str = parts[1].strip()
                if max_str == "":
                    return None
                if "+" in max_str:
                    return (min_val, 1000.0)
                max_val = float(max_str)
                return (min_val, max_val)
            except:
                pass
    
    # Natural language patterns: "under X", "below X", "max X", "up to X"
    for pattern in [r"under\s+([\d.]+)", r"below\s+([\d.]+)", r"max\s+([\d.]+)", r"upto\s+([\d.]+)", r"up to\s+([\d.]+)", r"maximum\s+([\d.]+)"]:
        match = re.search(pattern, text)
        if match:
            max_val = float(match.group(1))
            return (0.0, max_val)
    
    # Natural language patterns: "above X", "over X", "more than X", "atleast X", "at least X", "minimum X"
    for pattern in [r"above\s+([\d.]+)", r"over\s+([\d.]+)", r"more than\s+([\d.]+)", r"atleast\s+([\d.]+)", r"at least\s+([\d.]+)", r"minimum\s+([\d.]+)"]:
        match = re.search(pattern, text)
        if match:
            min_val = float(match.group(1))
            return (min_val, 1000.0)
    
    # Extract standalone number from text (e.g., "25 lakhs", "25L", "25lakh")
    numbers = re.findall(r"([\d.]+)\s*(?:lakh|lakhs|l|L)", text)
    if numbers:
        val = float(numbers[0])
        # If it's a simple number, treat as max budget
        if "under" in text or "below" in text or "max" in text or "upto" in text:
            return (0.0, val)
        else:
            # Default: treat as approximate value
            return (0.0, val)
    
    # Just a number
    numbers = re.findall(r"[\d.]+", text)
    if numbers:
        val = float(numbers[0])
        return (0.0, val)
    
    # Fallback text matching
    if "under 10" in text:
        return (0.0, 10.0)
    if "10 - 20" in text or "10-20" in text:
        return (10.0, 20.0)
    if "over 20" in text or "20+" in text:
        return (20.0, 1000.0)
    
    return None


def parse_body_types(message: str) -> Optional[List[str]]:
    text = message.strip().lower()
    if "skip" in text:
        return None
    
    # Natural language aliases for body types
    type_aliases = {
        "Hatchback": ["hatchback", "hatch"],
        "Sedan": ["sedan", "saloon"],
        "SUV": ["suv", "s.u.v", "sport utility", "sports utility vehicle"],
        "MPV": ["mpv", "m.p.v", "minivan", "van"],
        "Coupe SUV": ["coupe suv", "coupesuv"],
    }
    
    found = []
    for body_type in BODY_TYPES:
        # Direct match
        if body_type.lower() in text:
            found.append(body_type)
        # Alias match
        elif body_type in type_aliases:
            for alias in type_aliases[body_type]:
                if alias in text:
                    found.append(body_type)
                    break
    
    return list(set(found)) if found else None


def parse_brands(message: str) -> Optional[List[str]]:
    """Extract preferred brands, excluding those preceded by 'not', 'exclude', etc."""
    text = message.strip().lower()
    if "skip" in text:
        return None
    
    # Find excluded brands (not X, excluding X, except X) to skip them
    excluded_brands = []
    for pattern in [r"not\s+([a-z\s]+?)(?:\s|,|\.|$)", r"excluding\s+([a-z\s]+?)(?:\s|,|\.|$)", r"except\s+([a-z\s]+?)(?:\s|,|\.|$)"]:
        matches = re.findall(pattern, text)
        for match in matches:
            for car in INDIAN_CARS:
                if car["company"].lower() in match.lower():
                    excluded_brands.append(car["company"].lower())
    
    # Find preferred brands
    brands = []
    for car in INDIAN_CARS:
        brand = car["company"]
        if brand.lower() in text and brand.lower() not in excluded_brands and brand not in brands:
            brands.append(brand)
    
    return brands if brands else None


def parse_excluded_brands(message: str) -> Optional[List[str]]:
    """Extract brands that user explicitly excluded."""
    text = message.strip().lower()
    if "skip" in text:
        return None
    
    excluded_brands = []
    for pattern in [r"not\s+([a-z\s]+?)(?:\s|,|\.|$)", r"excluding\s+([a-z\s]+?)(?:\s|,|\.|$)", r"except\s+([a-z\s]+?)(?:\s|,|\.|$)"]:
        matches = re.findall(pattern, text)
        for match in matches:
            for car in INDIAN_CARS:
                if car["company"].lower() in match.lower():
                    excluded_brands.append(car["company"].lower())
    
    return list(set(excluded_brands)) if excluded_brands else None


def parse_primary_use(message: str) -> Optional[str]:
    text = message.strip().lower()
    if "skip" in text:
        return None
    if "city" in text:
        return "City"
    if "highway" in text:
        return "Highway"
    return None


def parse_fuel(message: str) -> Optional[List[str]]:
    text = message.strip().lower()
    if "skip" in text:
        return None
    
    # Natural language aliases for fuel types
    fuel_aliases = {
        "petrol": ["petrol", "patrol", "gasoline", "gas"],
        "Diesel": ["diesel", "disel"],
        "EV": ["ev", "electric", "electric vehicle"],
        "CNG": ["cng", "compressed natural gas"],
        "Hybrid": ["hybrid", "hybid"],
    }
    
    found = []
    for fuel in FUEL_TYPES:
        # Direct match
        if fuel.lower() in text:
            found.append(fuel)
        # Alias match
        elif fuel in fuel_aliases:
            for alias in fuel_aliases[fuel]:
                if alias in text:
                    found.append(fuel)
                    break
    
    return list(set(found)) if found else None


def parse_seating(message: str) -> Optional[int]:
    text = message.strip().lower()
    if "skip" in text:
        return None
    numbers = re.findall(r"\d+", text)
    if numbers:
        return int(numbers[0])
    return None


def parse_mileage_priority(message: str) -> Optional[bool]:
    text = message.strip().lower()
    if "skip" in text:
        return None
    if "yes" in text:
        return True
    if "no" in text:
        return False
    if "mileage" in text or "economy" in text or "fuel efficiency" in text:
        return True
    return None


def parse_yes_no(message: str) -> Optional[bool]:
    text = message.strip().lower()
    if "yes" in text or "show" in text or "recommendation" in text:
        return True
    if "no" in text or "more" in text or "question" in text:
        return False
    return None


def parse_extra_focus(message: str) -> Optional[str]:
    text = message.strip().lower()
    if "skip" in text or "no extra" in text:
        return None
    for focus in EXTRA_FOCUS_OPTIONS:
        if focus.lower() in text:
            return focus
    return None


def parse_transmission(message: str) -> Optional[str]:
    """Extract transmission preference (Automatic or Manual)."""
    text = message.strip().lower()
    if "skip" in text:
        return None
    if "automatic" in text or "auto" in text:
        return "Automatic"
    if "manual" in text:
        return "Manual"
    return None


def apply_answer(profile: dict, step: int, message: str) -> bool:
    if message.strip().lower() == "restart_chat":
        return True
    if message.strip().lower() == "skip preference":
        return True

    parser_map = {
        0: parse_budget,
        1: parse_body_types,
        2: parse_brands,
        3: parse_primary_use,
        4: parse_fuel,
        5: parse_seating,
        6: parse_transmission,
        7: parse_mileage_priority,
        8: parse_yes_no,
        9: parse_extra_focus,
        10: parse_yes_no,
    }
    parser = parser_map.get(step)
    if not parser:
        return True

    parsed = parser(message)
    if parsed is None and step != 9 and "skip" not in message.strip().lower():
        return False

    if step == 0:
        # Extract all preferences from the initial message
        extract_all_preferences(message, profile)
        # Still parse budget for this step
        if parsed:
            profile["budget_min_lakh"] = parsed[0]
            profile["budget_max_lakh"] = parsed[1]
        else:
            profile["budget_min_lakh"] = None
            profile["budget_max_lakh"] = None
    elif step == 1:
        profile["preferred_body_types"] = parsed or []
    elif step == 2:
        profile["preferred_brands"] = parsed or []
    elif step == 3:
        profile["primary_use"] = parsed
    elif step == 4:
        profile["preferred_fuel"] = parsed or []
    elif step == 5:
        profile["seating_max"] = parsed
    elif step == 6:
        profile["transmission_pref"] = parsed
    elif step == 7:
        profile["mileage_priority"] = parsed if parsed is not None else False
    elif step == 8:
        profile["show_recommendations"] = parsed
    elif step == 9:
        profile["extra_focus"] = parsed
    elif step == 10:
        profile["wants_more_questions"] = parsed
    return True


def build_recommendation_reply(profile: dict, show_with_continue: bool = False) -> Dict[str, Any]:
    """Build recommendation response with up to 4 cars and matched features."""
    recommendations = CarScorer.score_cars(profile)[:4]  # Max 4 recommendations
    if not recommendations:
        return {
            "reply": "I'm sorry, I couldn't find a strong match right now. You can restart and try again.",
            "options": [{"label": "Restart chat", "value": "restart_chat", "type": "restart"}]
        }

    lines = ["Based on what you shared, here are the top recommended cars:"]
    for idx, car in enumerate(recommendations, start=1):
        # Build feature string based on user preferences
        features = []
        
        # Add fuel type if user selected it
        if profile.get("preferred_fuel"):
            features.append(car['fuel'])
        
        # Add transmission if user selected it
        if profile.get("transmission_pref"):
            features.append(car['transmission'])
        
        # Add safety rating
        features.append(f"{car['safetyRating']}★ Safety")
        
        feature_str = ", ".join(features)
        
        lines.append(
            f"{idx}. {car['name']} — ₹{car['priceLakh']}L · {car['bodyType']} · {feature_str}"
        )
    lines.append("\nTap a car below to view its details in the catalogue.")

    options = [
        {
            "label": f"{car['name']} ({car['company']})",
            "value": car["id"],
            "type": "car"
        }
        for car in recommendations
    ]
    
    options.append({"label": "⚖️ Compare Recommended Cars", "value": "compare_recommended", "type": "compare"})
    options.append({"label": "🔄 Restart chat", "value": "restart_chat", "type": "restart"})

    return {
        "reply": "\n".join(lines),
        "options": options
    }

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    user_id: str
    messages: List[ChatMessage]

class ChatOption(BaseModel):
    label: str
    value: str
    type: str

class ChatResponse(BaseModel):
    reply: str
    options: List[Dict[str, Any]] = []
    show_skip: bool = False
    profile: Optional[Dict[str, Any]] = None

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        user_id = request.user_id
        profile = normalize_profile(ProfileManager.get_profile(user_id))
        last_message = request.messages[-1].content.strip() if request.messages else ""

        if last_message == "restart_chat":
            profile = normalize_profile(UserProfileData().dict())
            profile["dialog_step"] = 0
            profile["turn_count"] = 0
            profile["answered_steps"] = []
            ProfileManager.save_profile(user_id, profile)
            return ChatResponse(
                reply="Chat restarted! What is your approximate budget in lakhs to get started again?",
                options=build_options_for_step(0),
                show_skip=False,
                profile=profile
            )

        if last_message == "compare_recommended":
            # Build recommendation list and return ids for the frontend to handle
            recs = CarScorer.score_cars(profile)[:4]
            car_ids = [c["id"] for c in recs]
            car_options = [{"label": c["name"], "value": c["id"], "type": "car"} for c in recs]
            car_options.append({"label": "🔄 Restart chat", "value": "restart_chat", "type": "restart"})
            return ChatResponse(
                reply="Great! I've queued the recommended cars for comparison. Head to the Browse page to view the full comparison table.",
                options=car_options,
                show_skip=False,
                profile=profile
            )

        profile["turn_count"] = profile.get("turn_count", 0) + 1
        step = profile.get("dialog_step", 0)
        if step < 0 or step > 10:
            step = 0

        if not apply_answer(profile, step, last_message):
            return ChatResponse(
                reply=f"I didn't understand that answer. {build_question_for_step(step)}",
                options=build_options_for_step(step),
                show_skip=False,
                profile=profile
            )

        # After processing step 0, skip steps that are already answered
        if step == 0:
            next_step = get_next_unanswered_step(profile, 0)
            profile["dialog_step"] = next_step
        else:
            profile["dialog_step"] = step + 1

        ProfileManager.save_profile(user_id, profile)

        # Handle step 8 (show recommendations decision)
        if step == 8:
            profile["dialog_step"] = 9
            ProfileManager.save_profile(user_id, profile)
            return ChatResponse(
                reply=build_question_for_step(9),
                options=build_options_for_step(9),
                show_skip=False,
                profile=profile
            )

        # Handle step 9 (extra focus)
        if step == 9:
            profile["dialog_step"] = 10
            ProfileManager.save_profile(user_id, profile)
            return ChatResponse(
                reply=build_question_for_step(10),
                options=build_options_for_step(10),
                show_skip=False,
                profile=profile
            )

        # Handle step 10 (more questions decision)
        if step == 10:
            if profile.get("wants_more_questions"):
                profile["dialog_step"] = 8
                ProfileManager.save_profile(user_id, profile)
                return ChatResponse(
                    reply=build_question_for_step(8),
                    options=build_options_for_step(8),
                    show_skip=False,
                    profile=profile
                )
            # Show final recommendations
            ProfileManager.save_profile(user_id, profile)
            recommendations = build_recommendation_reply(profile)
            return ChatResponse(
                reply=recommendations["reply"],
                options=recommendations["options"],
                show_skip=False,
                profile=profile
            )

        # For steps 0-7, show next question
        if profile["dialog_step"] <= 7:
            next_question = build_question_for_step(profile["dialog_step"])
            return ChatResponse(
                reply=next_question,
                options=build_options_for_step(profile["dialog_step"]),
                show_skip=False,
                profile=profile
            )

        if profile["dialog_step"] == 8:
            return ChatResponse(
                reply=build_question_for_step(8),
                options=build_options_for_step(8),
                show_skip=False,
                profile=profile
            )

        # Default fallback — show recommendations
        ProfileManager.save_profile(user_id, profile)
        recommendations = build_recommendation_reply(profile)
        return ChatResponse(
            reply=recommendations["reply"],
            options=recommendations["options"],
            show_skip=False,
            profile=profile
        )
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
