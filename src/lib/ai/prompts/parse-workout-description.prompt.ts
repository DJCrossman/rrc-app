export const PARSE_WORKOUT_DESCRIPTION_PROMPT = `You are parsing a single rowing workout description into structured fields.

INPUT:
A free-text description of one workout. Examples: "60' steady state", "2x2000m @ 2k+15\\"", "easy row 45 min".

YOUR TASK:
Extract structured fields and output as a single JSON object (NOT an array).

OUTPUT SHAPE:
{
  "workoutType": "time" | "distance" | "other",
  "elapsedTime": <number, milliseconds, optional>,
  "distance": <number, meters, optional>,
  "intervalCount": <number>,
  "fragments": [ ... ]   // optional
}

FIELD RULES:
- workoutType: "time" if the workout is primarily time-bounded (e.g. "90'", "60 min"); "distance" if primarily distance-bounded (e.g. "2000m", "5km"); "other" if neither is clear.
- elapsedTime: total duration in milliseconds. "70'" = 4200000, "90'" = 5400000, "2x20'" = 2400000. Omit if no time present.
- distance: total distance in meters. "2000m" = 2000, "5km" = 5000, "2x2000m" = 4000. Omit if no distance present.
- intervalCount: total intervals. "3x3km" = 3, "2x2km + 4x500m" = 6, steady state = 1.
- fragments (optional): include ONLY when specific rate/split details are present. Each fragment:
  - rate (number, optional): strokes per minute. "@ R20" = 20, "R24" = 24. Omit if rate is open/free.
  - elapsedTime (number, optional): duration in ms. Use for time-based workouts. Should sum to workout elapsedTime.
  - distance (number, optional): meters. Use for distance-based workouts. Should sum to workout distance.
  - relativeTo: "2K" or "6K" — reference pace (default "2K" if just "+20\\"").
  - relativeSplit: split offset in milliseconds. "2k+20\\"" = 20000, "6k+15\\"" = 15000.
- DO NOT output description, startDate, or intensityCategory — the caller supplies those.
- Output ONLY valid JSON. No comments, no explanations, no surrounding prose.

EXAMPLES:

Input: "60' steady state"
Output:
\`\`\`json
{
  "workoutType": "time",
  "elapsedTime": 3600000,
  "intervalCount": 1
}
\`\`\`

Input: "2000m time trial @ max rate"
Output:
\`\`\`json
{
  "workoutType": "distance",
  "distance": 2000,
  "intervalCount": 1
}
\`\`\`

Input: "90'\\n2x30@6k+20\\" w/4\\" rest"
Output:
\`\`\`json
{
  "workoutType": "time",
  "elapsedTime": 5400000,
  "intervalCount": 2
}
\`\`\`

Input: "5000m\\n1000m @ R20, 2000m @ R22, 2000m @ R24"
Output:
\`\`\`json
{
  "workoutType": "distance",
  "distance": 5000,
  "intervalCount": 3,
  "fragments": [
    { "rate": 20, "distance": 1000, "relativeTo": "2K", "relativeSplit": 0 },
    { "rate": 22, "distance": 2000, "relativeTo": "2K", "relativeSplit": 0 },
    { "rate": 24, "distance": 2000, "relativeTo": "2K", "relativeSplit": 0 }
  ]
}
\`\`\`

Input: "easy row, 45 min"
Output:
\`\`\`json
{
  "workoutType": "time",
  "elapsedTime": 2700000,
  "intervalCount": 1
}
\`\`\`

Input: "stretching and core"
Output:
\`\`\`json
{
  "workoutType": "other",
  "intervalCount": 1
}
\`\`\`

Now parse the following workout description and output ONLY the JSON object:
`;
