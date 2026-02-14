export const PARSE_WORKOUT_SCREENSHOT_PROMPT = `You are analyzing a weekly calendar screenshot showing workout training plans.

CALENDAR FORMAT:
- The calendar shows a week starting on Sunday
- Month and year are visible in the header/title
- Each day cell shows the day number (e.g., "16" for the 16th)
- Workout descriptions are in the cell content, may span multiple lines
- Elapsed times may appear as patterns like "70'", "90'", "2x20'" (minutes format)
- Distances may appear as patterns like "2000m", "5km", "2x2000m"
- Intensity categories appear as C1-C6 (e.g., "C6", "C1", "(C3)")

YOUR TASK:
Extract all workouts from the calendar and output as JSON.

OUTPUT FORMAT:
Return a JSON object with a "workouts" array. Each workout has:
- description (string): Full workout text with \\n for line breaks
- startDate (string): ISO date format YYYY-MM-DD
- workoutType (string): One of "time", "distance", or "other"
- elaspedTime (number, optional): Elapsed time in milliseconds
- distance (number, optional): Distance in meters
- intervalCount (number): Total number of intervals (e.g., "3x3km" = 3, "2x2km + 4x500m" = 6, steady state = 1)
- intensityCategory (string): One of "C1", "C2", "C3", "C4", "C5", or "C6" - extract from description or default to "C6"
- do not include comments or explanations, only valid JSON

EXAMPLE OUTPUT:
\`\`\`json
{
  "workouts": [
    {
      "description": "pm Erg (C6)\\n90'\\n2x30@6k+20\\" w/4\\" rest",
      "startDate": "2025-12-17",
      "workoutType": "time",
      "elaspedTime": 5400000,
      "intervalCount": 2,
      "intensityCategory": "C6"
    },
    {
      "description": "60' C3; 2x2km @ tempo w/5' rest",
      "startDate": "2025-12-18",
      "workoutType": "time",
      "elaspedTime": 3600000,
      "intervalCount": 2,
      "intensityCategory": "C3"
    },
    {
      "description": "pm X-Training (C6)\\n60'",
      "startDate": "2025-12-19",
      "workoutType": "time",
      "elaspedTime": 3600000,
      "intervalCount": 1,
      "intensityCategory": "C6"
    },
    {
      "description": "2000m time trial @ max rate (C1)",
      "startDate": "2025-12-20",
      "workoutType": "distance",
      "distance": 2000,
      "intervalCount": 1,
      "intensityCategory": "C1"
    },
    {
      "description": "90' C5; Easy steady state",
      "startDate": "2025-12-21",
      "workoutType": "time",
      "elaspedTime": 5400000,
      "intervalCount": 1,
      "intensityCategory": "C5"
    }
  ]
}
\`\`\`

INSTRUCTIONS:
1. Read the month/year from the calendar header
2. For each day cell with workout content:
   - Read the day number above/in the cell
   - Construct ISO date: YYYY-MM-DD
   - Extract the full workout text, use \\n for line breaks
   - Determine workoutType: "time" if time-based (e.g., "90'"), "distance" if distance-based (e.g., "2000m"), or "other" if neither
   - Look for elapsed time patterns like "70'", "90'" and convert to milliseconds
   - If no elapsed time found, omit the elaspedTime field
   - Look for distance patterns like "2000m", "5km" and convert to meters
   - If no distance found, omit the distance field
   - Count total intervals from patterns like "3x3km" (3), "8 x 2.5'" (8), or 1 for steady state
   - Extract intensity category from patterns like "C6", "C1", "(C3)" - look for C followed by 1-6
   - If no intensity category found, default to "C6"
3. Output ONLY valid JSON, no explanation text

Now analyze the calendar image and extract workouts as JSON`;
