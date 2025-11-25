document.addEventListener('DOMContentLoaded', () => {
  // remove previously added items to avoid duplicates
  document.querySelectorAll('.from-storage').forEach(n => n.remove());

  const stored = JSON.parse(localStorage.getItem('subjects') || '[]');
  if (!stored.length) return;

  const dayToIndex = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4 };
  const tbody = document.querySelector('.timetable tbody');
  const cols = 5; // number of weekday columns in the table

  function ensureRow(index) {
    // ensure there are enough rows in tbody (index is 0-based for period)
    while (tbody.rows.length <= index) {
      const newRow = document.createElement('tr');
      const th = document.createElement('th');
      th.textContent = `${tbody.rows.length + 1}限`;
      newRow.appendChild(th);
      for (let i = 0; i < cols; i++) {
        const td = document.createElement('td');
        newRow.appendChild(td);
      }
      tbody.appendChild(newRow);
    }
    return tbody.rows[index];
  }

  stored.forEach(sub => {
    const { subjectName, classroom, teacherName, dayOfWeek, period } = sub;
    if (!subjectName) return;

    if (dayOfWeek === 'other') {
      const otherList = document.querySelector('.other-list');
      if (!otherList) return;
      const item = document.createElement('div');
      item.className = 'subject-cell from-storage';
      item.innerHTML = `<div class="subject-name">${escapeHtml(subjectName)}</div><div class="subject-room">${escapeHtml(classroom || '')} ${teacherName ? '(' + escapeHtml(teacherName) + ')' : ''}</div>`;
      otherList.appendChild(item);
      return;
    }

    const colIdx = dayToIndex[dayOfWeek];
    const periodIdx = Number(period) - 1;
    if (isNaN(colIdx) || isNaN(periodIdx) || colIdx < 0) return;

    const row = ensureRow(periodIdx);
    const cell = row.querySelectorAll('td')[colIdx];
    if (!cell) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'subject-cell from-storage';
    const name = document.createElement('div');
    name.className = 'subject-name';
    name.textContent = subjectName;
    const room = document.createElement('div');
    room.className = 'subject-room';
    room.textContent = classroom || '';
    wrapper.appendChild(name);
    wrapper.appendChild(room);

    cell.appendChild(wrapper);
  });

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>",']/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
  }
});
