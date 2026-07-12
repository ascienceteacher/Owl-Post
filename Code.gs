function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Owl Post')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setupOwlPost() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ['Roster', 'Teachers', 'Pending', 'Sent', 'Settings'].forEach(name => {
    if (!ss.getSheetByName(name)) ss.insertSheet(name);
  });

  ensureHeaders_(ss.getSheetByName('Roster'), [
    'Student ID', 'Student Name', 'Teacher', 'Period',
    'Parent Email', 'Parent Name', 'Last Communication Sent'
  ]);
  ensureHeaders_(ss.getSheetByName('Teachers'), [
    'Teacher Name', 'Teacher Code', 'Teacher Email', 'Active'
  ]);
  ensureHeaders_(ss.getSheetByName('Pending'), [
    'Timestamp', 'Student ID', 'Student Name', 'Teacher', 'Period',
    'Focus', 'Message', 'Status'
  ]);
  ensureHeaders_(ss.getSheetByName('Sent'), [
    'Sent Timestamp', 'Student ID', 'Student Name', 'Teacher', 'Period',
    'Parent Email', 'Focus', 'Message', 'Approved By'
  ]);
  ensureHeaders_(ss.getSheetByName('Settings'), ['Setting', 'Value']);

  const settings = ss.getSheetByName('Settings');
  if (settings.getLastRow() === 1) {
    settings.appendRow(['School Name', 'Rowlett Middle Academy']);
    settings.appendRow(['App Name', 'Owl Post']);
  }
  return 'Owl Post multi-teacher setup complete.';
}

function ensureHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return;
  }
  const current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
  headers.forEach((header, index) => {
    if (!current[index]) sheet.getRange(1, index + 1).setValue(header);
  });
  sheet.setFrozenRows(1);
}

function normalizePeriod_(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const match = raw.match(/([1-7])/);
  return match ? 'Period ' + match[1] : raw;
}

function getTeachers_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Teachers');
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues()
    .filter(r => String(r[0]).trim() && String(r[3] || 'TRUE').toUpperCase() !== 'FALSE')
    .map(r => ({
      name: String(r[0]).trim(),
      code: String(r[1]).trim(),
      email: String(r[2]).trim()
    }));
}

function getRoster_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Roster');
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getDataRange().getValues();
  const headers = values.shift().map(h => String(h).trim());
  const col = name => headers.indexOf(name);
  return values.filter(r => r[col('Student ID')]).map((r, i) => ({
    id: String(r[col('Student ID')]).trim(),
    name: String(r[col('Student Name')]).trim(),
    teacher: String(r[col('Teacher')]).trim(),
    period: normalizePeriod_(r[col('Period')]),
    parentEmail: String(r[col('Parent Email')] || '').trim(),
    parentName: String(r[col('Parent Name')] || 'Family').trim(),
    row: i + 2
  }));
}

function getAppData() {
  setupOwlPost();
  const roster = getRoster_();
  const teachers = getTeachers_().map(t => t.name);
  return {
    names: [...new Set(roster.map(r => r.name).filter(Boolean))].sort(),
    teachers: [...new Set(teachers)].sort(),
    periods: ['Period 1','Period 2','Period 3','Period 4','Period 5','Period 6','Period 7']
  };
}

function authenticateStudent(payload) {
  setupOwlPost();
  const name = String(payload.name || '').trim();
  const teacher = String(payload.teacher || '').trim();
  const period = normalizePeriod_(payload.period);
  const id = String(payload.studentId || '').trim();
  if (!name || !teacher || !period || !id) {
    throw new Error('Please choose your name, teacher, and period, then enter your student ID.');
  }
  const match = getRoster_().find(r =>
    r.name === name && r.teacher === teacher && r.period === period && r.id === id
  );
  if (!match) {
    throw new Error('Login did not match the roster. Check your teacher, period, name, and student ID.');
  }
  return {
    ok: true, name: match.name, teacher: match.teacher,
    period: match.period, studentId: match.id
  };
}

function submitOwlPost(payload) {
  const auth = authenticateStudent(payload);
  const focus = String(payload.focus || '').trim();
  const message = String(payload.message || '').trim();
  if (!focus) throw new Error('Please choose a focus.');
  if (message.length < 20) throw new Error('Please write a little more so your family understands your update.');
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pending').appendRow([
    new Date(), auth.studentId, auth.name, auth.teacher, auth.period,
    focus, message, 'Waiting for teacher approval'
  ]);
  return { ok: true };
}

function verifyTeacher_(teacherName, password) {
  const teacher = getTeachers_().find(t => t.name === String(teacherName || '').trim());
  if (!teacher) throw new Error('Teacher was not found in the Teachers sheet.');
  if (!teacher.code || String(password || '') !== teacher.code) {
    throw new Error('Teacher code did not match.');
  }
  return teacher;
}

function getPendingMessages(teacherName, password) {
  setupOwlPost();
  verifyTeacher_(teacherName, password);
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pending');
  if (sh.getLastRow() < 2) return [];
  const values = sh.getDataRange().getValues();
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][3]).trim() === teacherName && String(values[i][7]).startsWith('Waiting')) {
      rows.push({
        row: i + 1, timestamp: values[i][0], studentId: values[i][1],
        name: values[i][2], teacher: values[i][3], period: values[i][4],
        focus: values[i][5], message: values[i][6], status: values[i][7]
      });
    }
  }
  return rows.reverse();
}

function approveAndSend(row, teacherName, password) {
  const teacher = verifyTeacher_(teacherName, password);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pending = ss.getSheetByName('Pending');
  const sent = ss.getSheetByName('Sent');
  const r = Number(row);
  const data = pending.getRange(r, 1, 1, 8).getValues()[0];
  if (String(data[3]).trim() !== teacher.name) throw new Error('This message belongs to another teacher.');

  const student = getRoster_().find(x =>
    x.id === String(data[1]).trim() && x.name === String(data[2]).trim() && x.teacher === teacher.name
  );
  if (!student) throw new Error('Student was not found in the roster.');
  if (!student.parentEmail) throw new Error('No parent email is listed for this student.');

  const subject = `Owl Post Update from ${student.name}`;
  const body = `Hello ${student.parentName || 'Family'},\n\n${student.name} wanted to share this school update:\n\nFocus: ${data[5]}\n\n${data[6]}\n\nThis message was written by the student and approved by ${teacher.name}.\n\nThank you for supporting their learning!`;
  const mail = { to: student.parentEmail, subject: subject, body: body };
  if (teacher.email) mail.cc = teacher.email;
  MailApp.sendEmail(mail);

  pending.getRange(r, 8).setValue('Approved and sent');
  sent.appendRow([
    new Date(), student.id, student.name, teacher.name, student.period,
    student.parentEmail, data[5], data[6], teacher.name
  ]);
  ss.getSheetByName('Roster').getRange(student.row, 7).setValue(new Date());
  return { ok: true };
}
