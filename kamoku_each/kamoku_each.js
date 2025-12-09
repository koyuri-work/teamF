let currentSubject = null;

document.addEventListener('DOMContentLoaded', () => {
  // Get subject ID from URL query parameter
  const params = new URLSearchParams(window.location.search);
  const subjectId = parseInt(params.get('id'));

  if (!subjectId) {
    alert('科目が見つかりません');
    window.location.href = '../home/home.html';
    return;
  }

  // Load subject from localStorage
  const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
  currentSubject = subjects.find(s => s.id === subjectId);

  if (!currentSubject) {
    alert('科目が見つかりません');
    window.location.href = '../home/home.html';
    return;
  }

  displaySubjectInfo();
  drawGradeChart();
  displaySmallTests();
  attachEventListeners();
});

function displaySubjectInfo() {
  document.getElementById('subject-title').textContent = currentSubject.subjectName;
  document.getElementById('teacher-name').textContent = currentSubject.teacherName || '-';
  
  const dayMap = { mon: '月', tue: '火', wed: '水', thu: '木', fri: '金', other: 'その他' };
  document.getElementById('day-period').textContent = `${dayMap[currentSubject.dayOfWeek] || '-'}曜 ${currentSubject.period}限`;
  document.getElementById('classroom').textContent = currentSubject.classroom || '-';
  document.getElementById('credits').textContent = currentSubject.credits || '-';

  document.getElementById('attendance-count').textContent = currentSubject.attendanceCount || 0;
  document.getElementById('absence-count').textContent = currentSubject.absenceCount || 0;
  document.getElementById('late-count').textContent = currentSubject.lateCount || 0;

  document.getElementById('small-test-label').textContent = `小テスト ${currentSubject.smallTestRatio}%`;
  document.getElementById('final-exam-label').textContent = `期末テスト ${currentSubject.finalExamRatio}%`;
}

function drawGradeChart() {
  const canvas = document.getElementById('gradeChart');
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 80;

  const smallTestRatio = currentSubject.smallTestRatio || 30;
  const finalExamRatio = currentSubject.finalExamRatio || 70;

  // Draw pie chart
  const smallTestAngle = (smallTestRatio / 100) * 2 * Math.PI;
  
  // Small test (red)
  ctx.fillStyle = '#ff9999';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, 0, smallTestAngle);
  ctx.lineTo(centerX, centerY);
  ctx.fill();

  // Final exam (blue)
  ctx.fillStyle = '#99ccff';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, smallTestAngle, 2 * Math.PI);
  ctx.lineTo(centerX, centerY);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.stroke();
}

function displaySmallTests() {
  const list = document.getElementById('small-tests-list');
  list.innerHTML = '';

  if (!currentSubject.smallTests || currentSubject.smallTests.length === 0) {
    list.innerHTML = '<p>小テストはまだ登録されていません</p>';
    document.getElementById('average-score').textContent = '-';
    return;
  }

  currentSubject.smallTests.forEach((test, idx) => {
    const div = document.createElement('div');
    div.className = 'test-item';
    div.innerHTML = `
      <span>小テスト ${idx + 1}: ${test}点</span>
      <button class="btn-delete" onclick="deleteSmallTest(${idx})">削除</button>
    `;
    list.appendChild(div);
  });

  const avg = Math.round(currentSubject.smallTests.reduce((a, b) => a + b, 0) / currentSubject.smallTests.length);
  document.getElementById('average-score').textContent = avg;
}

function deleteSmallTest(idx) {
  if (currentSubject.smallTests) {
    currentSubject.smallTests.splice(idx, 1);
    updateSubject();
    displaySmallTests();
  }
}

function updateSubject() {
  const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
  const index = subjects.findIndex(s => s.id === currentSubject.id);
  if (index !== -1) {
    subjects[index] = currentSubject;
    localStorage.setItem('subjects', JSON.stringify(subjects));
  }
}

function attachEventListeners() {
  document.getElementById('add-test-btn').addEventListener('click', () => {
    const score = parseInt(document.getElementById('new-test-score').value);
    if (isNaN(score) || score < 0 || score > 100) {
      alert('0～100の数値を入力してください');
      return;
    }
    if (!currentSubject.smallTests) currentSubject.smallTests = [];
    currentSubject.smallTests.push(score);
    updateSubject();
    document.getElementById('new-test-score').value = '';
    displaySmallTests();
  });

  document.getElementById('add-attendance').addEventListener('click', () => {
    currentSubject.attendanceCount = (currentSubject.attendanceCount || 0) + 1;
    updateSubject();
    document.getElementById('attendance-count').textContent = currentSubject.attendanceCount;
  });

  document.getElementById('add-absence').addEventListener('click', () => {
    currentSubject.absenceCount = (currentSubject.absenceCount || 0) + 1;
    updateSubject();
    document.getElementById('absence-count').textContent = currentSubject.absenceCount;
  });

  document.getElementById('add-late').addEventListener('click', () => {
    currentSubject.lateCount = (currentSubject.lateCount || 0) + 1;
    updateSubject();
    document.getElementById('late-count').textContent = currentSubject.lateCount;
  });

  document.getElementById('edit-btn').addEventListener('click', openEditModal);
  document.getElementById('cancel-edit').addEventListener('click', closeEditModal);
  document.getElementById('edit-form').addEventListener('submit', saveEdit);
}

function openEditModal() {
  document.getElementById('edit-small-test-ratio').value = currentSubject.smallTestRatio || 30;
  document.getElementById('edit-final-exam-ratio').value = currentSubject.finalExamRatio || 70;
  document.getElementById('edit-teacher-name').value = currentSubject.teacherName || '';
  document.getElementById('edit-classroom').value = currentSubject.classroom || '';
  document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
}

function saveEdit(e) {
  e.preventDefault();
  currentSubject.smallTestRatio = parseInt(document.getElementById('edit-small-test-ratio').value) || 30;
  currentSubject.finalExamRatio = parseInt(document.getElementById('edit-final-exam-ratio').value) || 70;
  currentSubject.teacherName = document.getElementById('edit-teacher-name').value.trim();
  currentSubject.classroom = document.getElementById('edit-classroom').value.trim();
  updateSubject();
  closeEditModal();
  displaySubjectInfo();
  drawGradeChart();
}
