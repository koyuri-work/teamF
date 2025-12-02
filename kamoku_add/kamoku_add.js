// localStorage を使ってフォーム入力を保存 → home に反映させる
const subjectForm = document.querySelector('.subject-form');

subjectForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target;
    const subjectName = form.querySelector('#subject-name').value.trim();
    const teacherName = form.querySelector('#teacher-name').value.trim();
    const dayOfWeek = form.querySelector('#day-of-week').value;
    const period = form.querySelector('#period').value;
    const classroom = form.querySelector('#classroom').value.trim();
    const creditsRaw = form.querySelector('#credits').value;
    const credits = creditsRaw ? Number(creditsRaw) : null;

    if (!subjectName) {
        alert('科目名を入力してください');
        return;
    }

    const item = {
        id: Date.now(),
        subjectName,
        teacherName,
        dayOfWeek,
        period: String(period),
        classroom,
        credits,
        createdAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem('subjects') || '[]');
    existing.push(item);
    localStorage.setItem('subjects', JSON.stringify(existing));

    // 完了したらホームへ戻る（ユーザーがホームを見て更新を確認しやすい）
    window.location.href = '../home/home.html';
});
