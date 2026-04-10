document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const birthDate = document.getElementById('birthDate').value.trim();
  const phoneLast4 = document.getElementById('phoneLast4').value.trim();

  if (!name || !birthDate || !phoneLast4) {
    alert('이름, 생년월일, 휴대폰 뒤 4자리를 모두 입력하세요.');
    return;
  }

  alert('로그인 기능은 다음 단계에서 Supabase와 연결됩니다.');
});

document.getElementById('complaintForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const category = document.getElementById('category').value;
  const content = document.getElementById('content').value.trim();
  const anonymous = document.getElementById('anonymous').checked;

  if (!title || !content) {
    alert('제목과 내용을 입력하세요.');
    return;
  }

  console.log({
    title,
    category,
    content,
    anonymous
  });

  alert('현재는 화면 테스트 단계입니다. 접수 저장 기능은 다음 단계에서 연결됩니다.');
});
