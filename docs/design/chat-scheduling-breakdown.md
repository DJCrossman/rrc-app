# Chat & Scheduling — design breakdown

Source: Claude Design project "Club Rowing Application Redesign", file
`RRC Chat & Scheduling.dc.html`
(<https://claude.ai/design/p/6b0672ed-e27e-485b-b43b-8e4a73850ec0?file=RRC+Chat+%26+Scheduling.dc.html>).
Read on 2026-10-22. The design is a single interactive mockup with two tweaks
(`role`: admin | member, `replyMode`: thread | quote) and a desktop + mobile variant.

## What the design adds

Nothing in this design exists in the app today. The Prisma schema has athletes,
programs, memberships, boats, ergs, workouts, activities and the activity inbox; there
is no group, channel, message, event or notification model, and no realtime library.

### Groups
- Sidebar gets a **Groups** header entry (admin page) followed by the chat channel list.
- Groups page: table with Group, Auto-includes (RCA membership chips + "+1 added · 1
  excluded" overrides), Members (count), Who can post (everyone | coaches), chevron.
  Admin buttons: **Sync from RCA**, **New group**. Footer: "Last synced from RCA 2 hours
  ago · nightly auto-sync on". Copy: "Groups fill automatically from RCA membership type;
  add or exclude people by hand. Every group gets its own dashboard, chat and schedule."
- Group editor drawer (right, 420px): name, "{n} members · chat + schedule";
  **Auto-include RCA memberships** toggle chips (Competitive, Masters, Junior, Learn to
  Row, Recreational, Coach); **Who can post in chat**: Everyone | Coaches & admins;
  **Members**: "Add someone manually…" search with results, tabs (All / Auto / Added /
  Excluded), rows with badge (Auto | Added | Excluded) and action (Exclude | Include |
  Remove).
- Membership rule: auto = athlete has an active membership of a listed type, plus manual
  adds, minus exclusions. Mock groups: Masters, Juniors, Learn to Row, Coaches, Competitive.

### Chat
- Channels: **Everyone** (whole club), one per group, direct messages (DM list under a
  **Members** sidebar header, initials avatars). Unread badges per channel; opening a
  channel clears them.
- Channel header: name + icon; group channels have tabs **Overview / Chat / Schedule**;
  right side member count ("16 members", "2 people") and a bell (notification settings).
- Message row: initials avatar, author, time, role badge ("Coach"), optional quote block
  (quote-reply mode), text, forwarded block ("Forwarded from {channel}", original author,
  text or GIF), GIF placeholder, reactions row (emoji + count, tooltip lists who), thread
  summary ("3 replies · Last reply 6:05 AM", reply avatars). "Today" date divider.
- Hover actions: quick reactions ✅ 👀 🙌, add reaction (emoji picker), reply (thread panel
  or quote per tweak), forward, more.
- Thread panel (right aside, 380px): root message, replies, reply composer with GIF,
  emoji and "Also send to {channel}" checkbox.
- Composer: "Message {channel}" input, attach, GIF, emoji, @mention, send; quote-reply bar
  "Replying to {author} — {text}" with dismiss.
- Emoji picker: search, categories, 9-column grid. GIF picker: search + 2-column tiles
  ("GIF tiles are placeholders for a GIF provider").
- Forward modal: original "{author} in {channel}", "Send to" list of channels and DMs with
  kind label (Group | DM), optional note, Cancel / Forward; toast "Forwarded to {name}".
- Empty DM: "Start a conversation with {name}" / "Messages here are only visible to the
  two of you." Starting a DM from Members adds the person to the sidebar DM list.

### Schedule
- Sidebar **Schedule** entry with a "New" badge. Page: H1 Schedule, week navigation
  (prev / "Oct 19 – 25, 2026" / next / This week), type chips (All, Practices, Regattas,
  Volunteer), **Subscribe** (iCal), admin **New event**, group chips (All groups + each
  group; hidden inside a group's Schedule tab, which is locked to that group).
- Day rows Mon–Sun with today's date highlighted; events show time, title, type badge
  (Practice blue, Regatta red, Volunteer amber, Training green), workout (barbell icon),
  location (pin), group label ("Club-wide" or group names). Empty day: "Nothing scheduled".
- Right side per event: volunteer → "{filled} / {spots} filled" + Sign up / "Signed up ✓";
  admin → "{n} going · {m} no reply" opens the Responses modal; member in the audience →
  RSVP toggles Going / Maybe / Can't. Some events are no-RSVP (e.g. an entries deadline).
- Responses modal: title, when · group; counts Going / Maybe / Can't / No reply; people
  per status with membership; Close; "Nudge {n} who haven't replied" → toast "Reminder
  sent to {n} people".
- iCal modal: "Subscribe to your calendar", Include: All my groups | My volunteer shifts
  only, webcal URL + Copy, Google / Apple / Outlook, Done.
- Event audience = club-wide or the union of one or more groups' members.

### Dashboard "This week at the club" and group Overview tab
- Existing dashboard keeps the integration callout, metric cards (streak, distance,
  2K, duration), Total Meters chart and leaderboard.
- New section "This week at the club" with scope chips (All my groups, then each of my
  groups) and three cards: **Up next** (next event with RSVP buttons, then later
  events, "Full schedule"), **Needs your reply** (pending RSVPs with icon-only
  Going/Maybe/Can't; "You're all caught up."), **Messages** (channels sorted by unread
  with preview, time, badge; in group scope "Latest in chat" + "Open chat").
- Second row: **Availability** (next practice, Going/Maybe/Can't/No reply counts, "No
  reply yet: {names}", admin Nudge + "See all responses"), **Volunteer shifts** (sign-up
  buttons), and in group scope a **members** card (count, avatars, "Coaches: …", admin
  Manage).
- A group's Overview tab is the same dashboard scoped to the group (chart and
  leaderboard limited to its members, leaderboard program chip = group).

### Members page (rework of Athletes)
- Full-width page titled **Members**; toolbar: search, "All Programs", Active filter,
  **Add Member** split button (Bulk Add Members; admin: Sync from RCA).
- Table: Name (opens drawer), Active (check), Program, Groups (chips), Date Joined; row
  quick actions: Message (not on yourself) and ⋯ menu (View details, Send message, Edit,
  admin: Manage groups). Footer "{n} members." + paging.
- Drawer keeps Details, Indoors Stats, Programs, Activities; adds a **Message** button in
  the header and a **Groups** section (chips open the group; admin Manage; "Not in any
  groups.").

### Notifications
- Banner on dashboard and chat: "Notifications are off. Turn them on so you don't miss
  practice changes or messages from your groups." + "Turn on notifications" (browser
  permission prompt mock for app.clubrowing.ca).
- Per-channel bell in the chat header; "Notify me about replies" on mobile long-press.
- Mobile onboarding step "Don't miss a launch" with sample notifications (a coach's
  "Wind's up — moving tomorrow to the erg room, 6:00." and a schedule deadline),
  Turn on notifications / Not now → "Notifications on" + Continue.
- Admin nudges (schedule) send reminders.

### Mobile
- Bottom tabs Home / Chat / Schedule / More with badges. Chat list screen (search,
  Groups and Direct messages sections, previews, unread). Conversation screen (back,
  group name + member count, schedule and info buttons, long-press sheet: quick
  reactions, Reply in thread, Forward, Copy text, Notify me about replies). Schedule
  screen (7-day strip with dots, type chips, day list, 3-column RSVP buttons).

## Task waves

### Wave 1 — foundations, independent, run in parallel (all four merged to main by 2026-10-27)
1. **groups** — group model, rules and overrides, membership helpers, Groups page and
   editor drawer, sidebar entry.
2. **chat** — channels, messages, reactions, threads, forward, DMs, chat page, sidebar
   channel and DM lists, polling for new messages.
3. **schedule** — events, RSVPs, volunteer signups, week view, responses modal, iCal
   feed, admin event form.
4. **notifications** — web push subscriptions, preferences, banner and permission flow,
   onboarding step, `sendPush` service for the other features to call.

### Wave 2 — after wave 1 merges (all four cards proposed 2026-10-27)
5. **members page rework** — needs groups (Groups column and section) and chat (Message
   actions start a DM). Built 2026-10-27 on branch `claude/design-breakdown-tasks-468cb3`
   alongside the admin-access change: Members title, search, Groups chips, Message row
   action and ⋯ menu (View details, Send message, admin Edit), drawer Message button and
   Groups section; no Manage groups. Same day, David asked for the list to be users rather
   than athletes: rows now come from the default Clerk organization's members plus pending
   invitations, with athlete data joined by user id (or by email while unlinked) and
   athletes without an account kept as "No account" rows. The page moved to `/members` and is
   admin-only (query and page); admins invite several emails at once as members or admins
   through Clerk organization invitations, and `/signup` accepts the invitation ticket in
   place of the signup code.
6. **group pages and dashboard "This week at the club"** — group route with Overview /
   Chat / Schedule tabs; dashboard scope chips and cards; needs all three domains.
   Built 2026-10-28 on branch `claude/cool-knuth-kbx7tw`: `/groups/[id]` (Overview:
   Up next, Needs your reply, Latest in chat, Availability, members card, group meters
   chart, leaderboard limited to members), `/groups/[id]/schedule` (week view locked to
   the group) and the group's chat at `/chat/[channelId]`, all under one header with the
   tabs. Group channels are now created for every group (they never were before) and
   removed with the group; channel member counts come from group membership. Dashboard
   gets "This week at the club" with All my groups / per-group chips; Schedule shows a
   chip per group by name, and event cards name their groups instead of showing ids.
   Not done: the dashboard's group-scope members card, and volunteer shifts (hidden in
   the design too).
7. **navigation shell and mobile** — breadcrumbs, mobile bottom tabs, chat list and
   long-press sheet, schedule day strip.
8. **integration wiring** — relations from `channel.groupId` and `event_group.groupId` to
   `group`, group membership as the chat and schedule audience, nudges and new messages →
   push. No manual overrides and no post policy: David cut both from groups (2026-10-24
   and 2026-10-25), so groups fill from program rules only and every member can post.
   Admin access to every page for users without an athlete row is done separately on
   branch `claude/design-breakdown-tasks-468cb3` (reads on `viewerProcedure`).
   Still open as of 2026-10-28: event audiences (`getEventAudiences`) and group chat
   access still treat every athlete as in every group, and `channel.groupId` /
   `event_group.groupId` are plain columns, not relations.

## Integration contracts for wave 1

- Prisma: each task appends its models in its own `// ── <Area> ──` section at the end of
  `prisma/schema.prisma` with its own migration. No cross-task foreign keys yet: chat and
  schedule store `groupId String` columns that wave 2 turns into relations.
- IDs: `grp_`, `chan_`, `msg_`, `evt_`, `sub_` via the existing `generate_id()` default.
- Routers: one router per task registered in `src/server/root.ts` (`groups`, `chat`,
  `schedule`, `notifications`), following the commands/queries folder layout.
- Routes in `src/lib/routes.ts`; nav in `src/components/app-sidebar.tsx` (one entry per
  task; chat also renders the channel and DM lists). Expect trivial merge conflicts in
  those four files only.
- Audience: groups exports `getGroupMemberIds(db, groupId)`, `getAthleteGroupIds(db,
  athleteId)` and `isCoach(athlete)` from `src/server/routers/groups/common`. Until wave
  2, chat and schedule treat every athlete as a member of every group channel/event.
- Each session verifies migrations on its own isolated instance (`bun run
  instance:create` … `instance:destroy`).

## Open decisions

- Week start: the design shows Monday-first weeks; the training plan uses Sunday.
- Reply mode: threads are the design default; quote replies are the alternative tweak.
- "Coach" definition for role badges (the post policy was cut 2026-10-25): active
  membership in a program whose name contains "coach", or admin role, until something
  better exists.
- Athletes → Members: labels change per design; the `/athletes` URL can stay.
- Realtime: start with polling; no websocket/push service in the stack.
