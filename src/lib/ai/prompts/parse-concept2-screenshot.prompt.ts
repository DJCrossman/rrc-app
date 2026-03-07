export const PARSE_CONCEPT2_SCREENSHOT_PROMPT = `You are analyzing a Concept2 ERG activity screenshot showing workout results.

SCREENSHOT FORMAT:
The screenshot has a specific tabular layout:
- Header: "View Detail" at the top
- Left column: Workout description (e.g., "4x8:00/5:00r"), Date (e.g., "Jan 17, 2026")
- Right column: "Total Time:" label, Total time including rest (e.g., "52:00.0")
- Table with columns: "time  meter  /500m  s/m  ❤️"
- Separator line: "-------------------------------"
- Summary row: Total working time, total meters, average pace, average strokes/minute
- Separator line: "--------------------------------"
- Interval rows (if applicable): Each showing time, meters, pace, strokes/minute, heart rate
- Rest distance (if applicable): Shown as "r###" (e.g., "r634") below the intervals

EXAMPLE SCREENSHOT:
\`\`\`
View Detail
4x8:00/5:00r     Total Time:
Jan 17, 2026      52:00.0
time  meter  /500m s/m ❤️
-------------------------------
32:00.0  7610   2:06.1   26
--------------------------------
8:00.0   1885   2:07.3   26   163
8:00.0   1903   2:06.1   26   170
8:00.0   1898   2:06.4   26   173
8:00.0   1925   2:04.6   27   178
         r634
\`\`\`

YOUR TASK:
Extract the activity data and output as JSON.

OUTPUT FORMAT:
Return a JSON object with the following fields:
- name (string): The workout description from the screenshot (e.g., "4x8:00/5:00r")
- startDate (string): ISO date format YYYY-MM-DD parsed from the date shown (e.g., "Jan 17, 2026" → "2026-01-17")
- workoutType (string): One of "time", "distance", or "other"
  - "time" if description contains duration patterns like "8:00", "90'"
  - "distance" if description contains distance patterns like "2000m", "5km"
  - "other" if neither pattern is found
- elapsedTime (number): Elapsed working time in milliseconds (from summary row, NOT total time including rest)
  - Convert "mm:ss.s" or "h:mm:ss.s" to milliseconds
  - Use the first column of the summary row (e.g., "32:00.0" → 1920000)
- distance (number): Total meters rowed (from summary row)
  - Use the second column of the summary row (e.g., "7610" → 7610)
  - Do NOT subtract rest distance
- type (string): Always "erg"

IMPORTANT NOTES:
- Do NOT include athleteId, ergId, workoutId, or timezone fields in the output
- Use the summary row time (first data row), NOT the "Total Time" (which includes rest)
- Distance should be the total from summary row, including rest distance
- Times can be in format "mm:ss.s" or "h:mm:ss.s" - handle both
- Dates are shown as "Mon DD, YYYY" format - convert to ISO "YYYY-MM-DD"
- Month abbreviations: Jan=01, Feb=02, Mar=03, Apr=04, May=05, Jun=06, Jul=07, Aug=08, Sep=09, Oct=10, Nov=11, Dec=12

EXAMPLE OUTPUT:
\`\`\`json
{
  "name": "4x8:00/5:00r",
  "startDate": "2026-01-17",
  "workoutType": "time",
  "elapsedTime": 1920000,
  "distance": 7610,
  "type": "erg"
}
\`\`\`

INSTRUCTIONS:
1. Read the workout description from the left side below "View Detail"
2. Read the date and parse to ISO format YYYY-MM-DD
3. Determine workoutType based on description:
   - Look for duration patterns like "8:00", "90'" → "time"
   - Look for distance patterns like "2000m", "5km" → "distance"
   - Default to "other" if unclear
4. Find the summary row (first row after first separator)
5. Extract elapsed time from first column, convert to milliseconds:
   - Format "mm:ss.s": multiply minutes by 60000, seconds by 1000
   - Format "h:mm:ss.s": multiply hours by 3600000, minutes by 60000, seconds by 1000
6. Extract distance (meters) from second column of summary row
7. Set type to "erg"
8. Output ONLY valid JSON, no explanation text

Now analyze the Concept2 screenshot and extract the activity data as JSON`;
