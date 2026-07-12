OWL POST MULTI-TEACHER UPDATE

This ZIP updates the Google Apps Script portion of Owl Post.

CHANGES
- Student periods are limited to Period 1 through Period 7.
- Students choose their teacher and period at login.
- Teacher names are loaded from the Teachers tab in the Google Sheet.
- Each teacher uses an individual teacher code.
- Teachers only see messages submitted by their own students.
- Messages save the teacher name in Pending and Sent.

GOOGLE SHEET TABS
1. Teachers
   Teacher Name | Teacher Code | Teacher Email | Active

2. Roster
   Student ID | Student Name | Teacher | Period | Parent Email | Parent Name | Last Communication Sent

Use the teacher name exactly the same way in Teachers and Roster.
Use Period 1 through Period 7 in the Period column.

INSTALL
1. Open the Owl Post Google Sheet.
2. Extensions > Apps Script.
3. Replace the contents of Code.gs with the new Code.gs.
4. Replace the contents of Index.html with the new Index.html.
5. Save.
6. Run setupOwlPost once and approve permissions.
7. Deploy > Manage deployments > Edit > New version > Deploy.

Your existing /exec address should remain the same when you update the existing deployment.
