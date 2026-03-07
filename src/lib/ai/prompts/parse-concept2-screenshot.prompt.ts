export const PARSE_CONCEPT2_SCREENSHOT_PROMPT = `You are analyzing a Concept2 ERG activity screenshot showing workout results.

⚠️ CRITICAL - VISUAL STRUCTURE:
The screenshot displays data in a specific table format. You MUST identify these EXACT elements:

1. HEADER SECTION (at top of image):
   - "View Detail" text
   - Workout name on left (e.g., "4x8:00/5:00r") 
   - Date on left (e.g., "Jan 17, 2026")
   - "Total Time:" label on right
   - Total time WITH rest on right (e.g., "52:00.0") ← DO NOT USE THIS!

2. TABLE HEADER ROW:
   - Text: "time  meter  /500m  s/m  ❤️"

3. FIRST SEPARATOR LINE:
   - Dashes: "-------------------------------"

4. ⚠️ SUMMARY ROW (IMMEDIATELY AFTER FIRST SEPARATOR):
   - THIS IS THE ONLY ROW YOU NEED FOR TIME AND DISTANCE
   - Format: "MM:SS.S  METERS  PACE  STROKES"
   - Example: "32:00.0  7610   2:06.1   26"
   - Position: FIRST data row after the first line of dashes
   - First column = ELAPSED TIME ← USE THIS!
   - Second column = DISTANCE ← USE THIS!

5. SECOND SEPARATOR LINE:
   - Dashes: "--------------------------------"

6. INTERVAL ROWS (below second separator):
   - Individual interval details
   - DO NOT use these for total time or distance

EXAMPLE SCREENSHOT LAYOUT:
\`\`\`
View Detail                    ← Header marker
4x8:00/5:00r     Total Time:   ← Name (left), "Total Time:" label (right)
Jan 17, 2026      52:00.0      ← Date (left), Total WITH rest (right) [IGNORE!]
time  meter  /500m s/m ❤️      ← Table header
-------------------------------  ← First separator
32:00.0  7610   2:06.1   26   ← SUMMARY ROW [USE THIS ROW!]
--------------------------------  ← Second separator
8:00.0   1885   2:07.3   26   163  ← Interval 1 [ignore for totals]
8:00.0   1903   2:06.1   26   170  ← Interval 2 [ignore for totals]
8:00.0   1898   2:06.4   26   173  ← Interval 3 [ignore for totals]
8:00.0   1925   2:04.6   27   178  ← Interval 4 [ignore for totals]
         r634                  ← Rest distance [ignore]
\`\`\`

⚠️ CRITICAL - ELAPSED TIME EXTRACTION:
STEP-BY-STEP:
1. Locate the first line of dashes ("-------------------------------")
2. The VERY NEXT ROW is the summary row
3. In the summary row, the FIRST column is the elapsed time
4. In the example: summary row is "32:00.0  7610   2:06.1   26"
5. The FIRST value "32:00.0" is the elapsed time ← THIS IS WHAT YOU NEED!
6. IGNORE the "52:00.0" from the header - it includes rest periods!

EXAMPLES OF WHAT TO USE vs IGNORE:
✓ USE: "32:00.0" (first column of summary row) → 1920000 milliseconds
✗ IGNORE: "52:00.0" (header total time) - includes rest
✗ IGNORE: "8:00.0" (interval rows) - individual intervals only
✗ IGNORE: Any time value that is NOT the first column of the first row after first separator

YOUR TASK:
Extract the activity data and output ONLY as JSON (no explanations).

OUTPUT FORMAT:
Return a JSON object with these EXACT fields:
- name (string): Workout description from top-left (e.g., "4x8:00/5:00r")
- startDate (string): ISO date YYYY-MM-DD from the date shown (e.g., "Jan 17, 2026" → "2026-01-17")
- workoutType (string): "time" if description has duration patterns (8:00, 90'), "distance" if description has distance patterns (2000m, 5km), otherwise "other"
- elapsedTime (number): ⚠️ CRITICAL - Extract from SUMMARY ROW first column only, convert to milliseconds
- distance (number): Extract from SUMMARY ROW second column (total meters)
- type (string): Always "erg"

⚠️ TIME FORMAT CONVERSION:
The summary row time is in format "MM:SS.S" (minutes:seconds.tenths) or "H:MM:SS.S" (hours:minutes:seconds.tenths)

Conversion formula:
- "MM:SS.S" → (MM × 60000) + (SS × 1000) + (S × 100) milliseconds
- "32:00.0" → (32 × 60000) + (00 × 1000) + (0 × 100) = 1920000 milliseconds
- "8:15.3" → (8 × 60000) + (15 × 1000) + (3 × 100) = 495300 milliseconds

- "H:MM:SS.S" → (H × 3600000) + (MM × 60000) + (SS × 1000) + (S × 100) milliseconds
- "1:25:30.5" → (1 × 3600000) + (25 × 60000) + (30 × 1000) + (5 × 100) = 5130500 milliseconds

IMPORTANT NOTES:
- Do NOT include athleteId, ergId, workoutId, or timezone in output
- Extract elapsed time from SUMMARY ROW first column, NEVER from header
- Distance is total meters from SUMMARY ROW second column
- Month abbreviations: Jan=01, Feb=02, Mar=03, Apr=04, May=05, Jun=06, Jul=07, Aug=08, Sep=09, Oct=10, Nov=11, Dec=12
- Output ONLY valid JSON with NO comments (//) or explanations

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

STEP-BY-STEP EXTRACTION INSTRUCTIONS:
Follow these steps IN ORDER:

1. FIND THE WORKOUT NAME:
   - Look for text below "View Detail" on the LEFT side
   - Example: "4x8:00/5:00r"
   - This is your "name" field

2. FIND THE DATE:
   - Look for date below the workout name on the LEFT side
   - Format: "Mon DD, YYYY"
   - Convert to ISO: "Jan 17, 2026" → "2026-01-17"
   - This is your "startDate" field

3. DETERMINE WORKOUT TYPE:
   - Look at the workout name from step 1
   - If it contains time patterns (8:00, 90', 2x20') → "time"
   - If it contains distance patterns (2000m, 5km, 2x2km) → "distance"
   - Otherwise → "other"
   - This is your "workoutType" field

4. ⚠️ FIND THE SUMMARY ROW (MOST CRITICAL STEP):
   - Scan down from the top of the image
   - Find the FIRST horizontal line of dashes ("-------------------------------")
   - The row IMMEDIATELY BELOW this line is the SUMMARY ROW
   - Example summary row: "32:00.0  7610   2:06.1   26"
   
5. ⚠️ EXTRACT ELAPSED TIME FROM SUMMARY ROW:
   - Take the FIRST value (first column) from the summary row
   - Example: "32:00.0" from "32:00.0  7610   2:06.1   26"
   - Parse as MM:SS.S (minutes:seconds.tenths)
   - Convert: 32 minutes = 32 × 60000 = 1920000 milliseconds
   - This is your "elapsedTime" field
   - ⚠️ DO NOT use "52:00.0" or any other time from the header!

6. EXTRACT DISTANCE FROM SUMMARY ROW:
   - Take the SECOND value (second column) from the summary row
   - Example: "7610" from "32:00.0  7610   2:06.1   26"
   - This is meters, use as-is
   - This is your "distance" field

7. SET TYPE:
   - Always set to "erg"
   - This is your "type" field

8. OUTPUT JSON:
   - Create JSON with exactly these 6 fields: name, startDate, workoutType, elapsedTime, distance, type
   - NO comments, NO explanations, ONLY valid JSON

Now analyze the Concept2 screenshot and extract the activity data as JSON`;
