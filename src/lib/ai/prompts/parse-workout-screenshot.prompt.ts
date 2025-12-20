export const PARSE_WORKOUT_SCREENSHOT_PROMPT = `You are analyzing a weekly calendar screenshot showing workout training plans.

CALENDAR FORMAT:
- The calendar shows a week starting on Sunday
- Month and year are visible in the header/title
- Each day cell shows the day number (e.g., "16" for the 16th)
- Workout descriptions are in the cell content, may span multiple lines
- Durations may appear as patterns like "70'", "90'", "2x20'" (minutes format)

YOUR TASK:
Extract all workouts from the calendar and output as JSON.

OUTPUT FORMAT:
Return a JSON object with a "workouts" array. Each workout has:
- description (string): Full workout text with \\n for line breaks
- startDate (string): ISO date format YYYY-MM-DD
- duration (number, optional): Duration in milliseconds
- do not include comments or explanations, only valid JSON

EXAMPLE OUTPUT:
\`\`\`json
{
  "workouts": [
    {
      "description": "pm Erg (C6)\\n90'\\n2x30@6k+20\\" w/4\\" rest",
      "startDate": "2025-12-17",
      "duration": 5400000
    },
    {
      "description": "pm X-Training (C6)\\n60'",
      "startDate": "2025-12-19",
      "duration": 3600000
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
   - Look for duration patterns like "70'", "90'" and convert to milliseconds
   - If no duration found, omit the duration field
3. Output ONLY valid JSON, no explanation text

Now analyze the calendar image and extract workouts as JSON`;
