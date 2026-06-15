# AlignMate/workout_planner.py

import random
from langchain_core.prompts import PromptTemplate
from llm_provider import get_llm

llm = get_llm(temperature=0.8)

PLAN_TEMPLATE = """
You are an expert fitness coach and nutritionist at AlignMate.
Generate a detailed personalized weekly workout and diet plan.
Respond ONLY in valid JSON. No markdown, no explanation, no text outside the JSON.

User Profile:
- Age: {age} | Height: {height_cm}cm | Weight: {weight_kg}kg
- Lifestyle: {lifestyle} | Level: {level}
- Goal: {goal} | Equipment: {equipment} | Diet: {diet}

Return EXACTLY this JSON structure:
{{
  "summary": "3 sentence personalized overview",
  "weekly_plan": [
    {{
      "day": "Monday",
      "focus": "Chest & Triceps",
      "exercises": [
        {{
          "name": "Barbell Bench Press",
          "sets": 4,
          "reps": "6-8",
          "rest": "90s",
          "tip": "Keep shoulder blades retracted and drive through your chest"
        }}
      ]
    }}
  ],
  "diet_plan": {{
    "daily_calories": 2500,
    "macros": {{
      "protein_g": 180,
      "carbs_g": 250,
      "fats_g": 75
    }},
    "days": [
      {{
        "day": "Monday",
        "meals": [
          {{
            "name": "Breakfast",
            "time": "8:00 AM",
            "foods": ["Oats with banana", "3 boiled eggs", "Black coffee"],
            "calories": 550,
            "protein_g": 30
          }}
        ]
      }}
    ]
  }},
  "tips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4"]
}}

STRICT WORKOUT RULES:
- weekly_plan MUST have exactly 7 days
- Training days: 5-6 exercises, rest days: empty exercises array []
- Recommended split for intermediate/advanced: PPL (Push/Pull/Legs) or Upper/Lower
- For beginner: Full body 3x per week
- HYPERTROPHY FOCUS: Always start with 1-2 heavy compound movements (bench, squat, deadlift, row, OHP)
- Then 2-3 isolation exercises after compounds
- Rep ranges: bulk/strength = 4-8 reps heavy compounds, 8-12 isolation
- Rep ranges: weight_loss/cut = 10-15 reps, shorter rest 45-60s
- Rep ranges: flexibility/stamina = higher reps, circuits
- Equipment home = bodyweight only (pushups, dips, lunges, planks)
- Equipment gym = barbells, dumbbells, cables, machines
- Every day title MUST have specific muscle group (e.g. "Push - Chest, Shoulders & Triceps")
- Form tips must be specific and technical, not generic

STRICT DIET RULES:
- diet_plan.days MUST have 7 days (Monday to Sunday)
- Each day MUST have 5 meals: Breakfast, Mid-Morning Snack, Lunch, Pre-Workout/Evening Snack, Dinner
- VARIETY IS MANDATORY: No meal should repeat across the 7 days
- Monday breakfast ≠ Tuesday breakfast ≠ any other day
- Rotate protein sources, carb sources, and vegetables every day
- veg diet: NO meat, NO fish, NO eggs — use paneer, tofu, lentils, chickpeas, Greek yogurt, cottage cheese
- non_veg diet: rotate between chicken, eggs, fish, lean beef across days
- vegan diet: NO animal products — use tofu, tempeh, lentils, chickpeas, nuts, seeds
- Calories and macros must match the goal: bulk = surplus, cut/weight_loss = deficit

Respond with ONLY the JSON. Nothing else.
"""

prompt = PromptTemplate(
    input_variables=[
        "age", "height_cm", "weight_kg",
        "lifestyle", "level", "goal",
        "equipment", "diet"
    ],
    template=PLAN_TEMPLATE,
)

chain = prompt | llm


def generate_plan(
    age:       int,
    height_cm: float,
    weight_kg: float,
    lifestyle: str,
    level:     str,
    goal:      str,
    equipment: str,
    diet:      str,
) -> dict:
    try:
        result = chain.invoke({
            "age": age, "height_cm": height_cm, "weight_kg": weight_kg,
            "lifestyle": lifestyle, "level": level, "goal": goal,
            "equipment": equipment, "diet": diet,
        })

        import json, re
        text = result.content if hasattr(result, "content") else result
        text = text.strip()
        text = re.sub(r"```json\s*", "", text)
        text = re.sub(r"```\s*",     "", text)

        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            text = match.group()

        return json.loads(text)

    except Exception as e:
        print(f"[WARNING] Ollama model error ({e}). Generating dynamic fallback plan...")
        
        # Dynamic fallback workout planner in Python
        days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        weight = weight_kg or 70.0
        height = height_cm or 170.0
        g = goal or "Stay Fit"
        eq = equipment or "Gym"
        dt = diet or "Non-Veg"
        lvl = level or "Beginner"
        
        # Determine calories and macros based on goal/weight
        if "gain" in g.lower() or "bulk" in g.lower():
            calories = int(weight * 35 + 500)
            protein = int(weight * 2.0)
            carbs = int(calories * 0.5 / 4)
            fats = int(calories * 0.25 / 9)
        elif "lose" in g.lower() or "cut" in g.lower() or "fat" in g.lower():
            calories = int(weight * 30 - 500)
            protein = int(weight * 2.2)
            carbs = int(calories * 0.4 / 4)
            fats = int(calories * 0.25 / 9)
        else:
            calories = int(weight * 32)
            protein = int(weight * 1.8)
            carbs = int(calories * 0.55 / 4)
            fats = int(calories * 0.20 / 9)
            
        summary = f"A customized {lvl.lower()} program designed for your goal of {g.lower()} with {eq.lower()} equipment. Focuses on maintaining functional posture, steady progress, and a balanced {dt.lower()} meal plan containing {calories} kcal."
        
        weekly_plan = []
        diet_days = []
        
        # Simple workouts based on equipment
        gym_exercises = {
            "Push": [
                {"name": "Bench Press", "sets": 4, "reps": "8-10", "rest": "90s", "tip": "Retract scapula and press from chest"},
                {"name": "Shoulder Press", "sets": 3, "reps": "10-12", "rest": "60s", "tip": "Brace core, press fully overhead"},
                {"name": "Incline Dumbbell Press", "sets": 3, "reps": "10-12", "rest": "60s", "tip": "Tuck elbows slightly"},
                {"name": "Lateral Raise", "sets": 4, "reps": "12-15", "rest": "45s", "tip": "Lead with elbows, controlled lower"},
                {"name": "Tricep Dip", "sets": 3, "reps": "10-12", "rest": "60s", "tip": "Keep elbows pointing backwards"}
            ],
            "Pull": [
                {"name": "Deadlift", "sets": 3, "reps": "5", "rest": "120s", "tip": "Keep bar close to shins, neutral spine"},
                {"name": "Barbell Row", "sets": 4, "reps": "8-10", "rest": "90s", "tip": "Hinge at hips, pull bar to belly button"},
                {"name": "Lat Pulldown", "sets": 3, "reps": "10-12", "rest": "60s", "tip": "Pull with elbows, squeeze shoulder blades"},
                {"name": "Bicep Curl", "sets": 3, "reps": "12-15", "rest": "45s", "tip": "Keep elbows fixed at your sides"},
                {"name": "Face Pulls", "sets": 4, "reps": "15", "rest": "45s", "tip": "Pull rope towards ears and squeeze"}
            ],
            "Legs": [
                {"name": "Squat", "sets": 4, "reps": "8-10", "rest": "90s", "tip": "Drive knees out, push through heels"},
                {"name": "Lunge", "sets": 3, "reps": "10 each", "rest": "60s", "tip": "Keep front knee aligned with toes"},
                {"name": "Hip Thrust", "sets": 4, "reps": "10-12", "rest": "90s", "tip": "Squeeze glutes at top lockout"},
                {"name": "Leg Press", "sets": 3, "reps": "10-12", "rest": "60s", "tip": "Don't lock knees at the top"},
                {"name": "Plank", "sets": 3, "reps": "60s hold", "rest": "45s", "tip": "Maintain straight spine, squeeze core"}
            ]
        }
        
        home_exercises = {
            "Upper": [
                {"name": "Pushups", "sets": 4, "reps": "12-15", "rest": "60s", "tip": "Body in flat plank, chest near floor"},
                {"name": "Pike Pushups", "sets": 3, "reps": "8-10", "rest": "60s", "tip": "Hips high, lower head towards floor"},
                {"name": "Incline Pushups", "sets": 3, "reps": "12-15", "rest": "60s", "tip": "Hands on elevated surface"},
                {"name": "Tricep Dips", "sets": 3, "reps": "12-15", "rest": "45s", "tip": "Using a chair or bench"},
                {"name": "Plank Shoulder Taps", "sets": 3, "reps": "20 total", "rest": "45s", "tip": "Minimize hip rocking"}
            ],
            "Lower": [
                {"name": "Bodyweight Squats", "sets": 4, "reps": "20", "rest": "60s", "tip": "Keep chest high, hips below knees"},
                {"name": "Lunges", "sets": 3, "reps": "12 each", "rest": "60s", "tip": "Step back/forward, keep torso upright"},
                {"name": "Glute Bridges", "sets": 4, "reps": "15-20", "rest": "45s", "tip": "Squeeze glutes at the top"},
                {"name": "Single Leg Deadlift", "sets": 3, "reps": "10 each", "rest": "45s", "tip": "Keep hips square, flat back"},
                {"name": "Plank", "sets": 3, "reps": "45s hold", "rest": "45s", "tip": "Squeeze core, glutes, and legs"}
            ]
        }
        
        # Build weekly plan
        for idx, day in enumerate(days_of_week):
            if idx == 2 or idx == 6: # Wed & Sun are rest days
                weekly_plan.append({"day": day, "focus": "Active Recovery & Rest", "exercises": []})
            else:
                if "gym" in eq.lower():
                    splits = ["Push", "Pull", "Legs", "Push", "Pull"]
                    focus = splits[idx % len(splits)]
                    exs = gym_exercises[focus]
                else:
                    splits = ["Upper", "Lower", "Upper", "Lower", "Upper"]
                    focus = splits[idx % len(splits)]
                    exs = home_exercises[focus]
                weekly_plan.append({"day": day, "focus": f"{focus} Day", "exercises": exs})
                
        # Build diet plan
        veg_meals = [
            {"Breakfast": ["Oatmeal with almonds & seeds", "Greek yogurt", "Green tea"], "Mid-Snack": ["Apple with peanut butter"], "Lunch": ["Tofu/Paneer stir fry with brown rice", "Mixed salad"], "Evening-Snack": ["Roasted chickpeas", "Protein shake"], "Dinner": ["Lentil soup (Dal) with quinoa", "Steamed vegetables"]},
            {"Breakfast": ["Sprouted moong dal chilla", "Mint chutney", "Buttermilk"], "Mid-Snack": ["Mixed berries & walnuts"], "Lunch": ["Chickpea salad with olive oil dressing", "Whole wheat pita"], "Evening-Snack": ["Cottage cheese", "Handful of almonds"], "Dinner": ["Paneer bhurji with roti", "Sautéed spinach"]},
            {"Breakfast": ["Chia pudding with soy milk & banana", "Walnuts"], "Mid-Snack": ["Roasted foxnuts (Makhana)"], "Lunch": ["Soya chunks curry with brown rice", "Cucumber salad"], "Evening-Snack": ["Hummus with carrot & cucumber sticks"], "Dinner": ["Mushroom & tofu soup", "Steamed broccoli & sweet potato"]}
        ]
        
        nonveg_meals = [
            {"Breakfast": ["3 Scrambled eggs", "2 slices whole wheat toast", "Black coffee"], "Mid-Snack": ["Mixed fruits & almonds"], "Lunch": ["Grilled chicken breast", "Sweet potato", "Broccoli"], "Evening-Snack": ["Boiled eggs", "Whey protein shake"], "Dinner": ["Baked salmon or fish curry", "Quinoa", "Asparagus"]},
            {"Breakfast": ["Egg white omelette with spinach & mushrooms", "Green tea"], "Mid-Snack": ["Greek yogurt with berries"], "Lunch": ["Turkey wrap with whole wheat tortilla", "Side salad"], "Evening-Snack": ["Canned tuna or boiled chicken salad"], "Dinner": ["Chicken breast stir fry", "Brown rice", "Mixed bell peppers"]},
            {"Breakfast": ["Whey protein shake with oatmeal & peanut butter"], "Mid-Snack": ["Hard boiled eggs (2)"], "Lunch": ["Minced beef or chicken", "Sautéed vegetables", "Basmati rice"], "Evening-Snack": ["Pumpkin seeds & beef jerky"], "Dinner": ["Grilled prawns or grilled chicken", "Cauliflower rice", "Green beans"]}
        ]
        
        meals_source = veg_meals if "veg" in dt.lower() else nonveg_meals
        
        for idx, day in enumerate(days_of_week):
            day_meal_template = meals_source[idx % len(meals_source)]
            meals_list = []
            for meal_name, foods in day_meal_template.items():
                meals_list.append({
                    "name": meal_name,
                    "time": "08:00 AM" if meal_name == "Breakfast" else "11:00 AM" if meal_name == "Mid-Snack" else "01:30 PM" if meal_name == "Lunch" else "05:30 PM" if meal_name == "Evening-Snack" else "08:30 PM",
                    "foods": foods,
                    "calories": int(calories * 0.2),
                    "protein_g": int(protein * 0.2)
                })
            diet_days.append({"day": day, "meals": meals_list})
            
        diet_plan = {
            "daily_calories": calories,
            "macros": {
                "protein_g": protein,
                "carbs_g": carbs,
                "fats_g": fats
            },
            "days": diet_days
        }
        
        tips = [
            "Keep your spine neutral during all compound lifts to protect your back.",
            "Stay hydrated — drink at least 3-4 liters of water daily.",
            "Focus on the mind-muscle connection during each rep.",
            "Ensure 7-8 hours of quality sleep for muscle recovery."
        ]
        
        return {
            "summary": summary,
            "weekly_plan": weekly_plan,
            "diet_plan": diet_plan,
            "tips": tips
        }