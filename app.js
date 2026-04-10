const SUPABASE_URL = "https://fnmfclvplcmymbzofvef.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2Nf7DTmz7fO-GZCcyJBZlQ_ZV7WSJOj";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

function normalizeBirthDate(value) {
  return value.replace(/\D/g, "").trim();
}

function normalizePhoneLast4(value) {
  return value.replace(/\D/g, "").trim();
}

document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const birthDate = normalizeBirthDate(document.getElementById("birthDate").value);
  const phoneLast4 = normalizePhoneLast4(document.getElementById("phoneLast4").value);

  if (!name || !birthDate || !phoneLast4) {
    alert("이름, 생년월일, 휴대폰 뒤 4자리를 모두 입력하세요.");
    return;
  }

  if (birthDate.length !== 8) {
    alert("생년월일은 8자리로 입력하세요.");
    return;
  }

  if (phoneLast4.length !== 4) {
    alert("휴대폰 뒤 4자리를 정확히 입력하세요.");
    return;
  }

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("name", name)
    .eq("birth_date", birthDate)
    .eq("phone_last4", phoneLast4)
    .eq("is_active", true)
    .limit(1);

  if (error) {
    console.error(error);
    alert("로그인 확인 중 오류가 발생했습니다.");
    return;
  }

  if (!data || data.length === 0) {
    alert("일치하는 직원 정보를 찾을 수 없습니다.");
    return;
  }

  currentUser = data[0];
  alert(`${currentUser.name}님 로그인되었습니다.`);
});

document.getElementById("complaintForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!currentUser) {
    alert("먼저 로그인하세요.");
    return;
  }

  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("category").value;
  const content = document.getElementById("content").value.trim();
  const anonymous = document.getElementById("anonymous").checked;

  if (!title || !content) {
    alert("제목과 내용을 입력하세요.");
    return;
  }

  const { error } = await supabaseClient.from("complaints").insert([
    {
      user_id: currentUser.id,
      title: title,
      category: category,
      content: content,
      is_anonymous: anonymous,
      status: "접수됨"
    }
  ]);

  if (error) {
    console.error(error);
    alert("고충 접수 저장 중 오류가 발생했습니다.");
    return;
  }

  alert("고충이 정상적으로 접수되었습니다.");
  document.getElementById("complaintForm").reset();
});
document.getElementById("anonymousReportForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const reportCategory = document.getElementById("reportCategory").value;
  const reportTitle = document.getElementById("reportTitle").value.trim();
  const reportContent = document.getElementById("reportContent").value.trim();

  if (!reportCategory || !reportTitle || !reportContent) {
    alert("제보 유형, 제목, 내용을 모두 입력하세요.");
    return;
  }

  const { error } = await supabaseClient.from("complaints").insert([
    {
      user_id: null,
      title: reportTitle,
      category: reportCategory,
      content: reportContent,
      is_anonymous: true,
      status: "접수됨",
      submission_type: "anonymous_report",
      reporter_name: "익명"
    }
  ]);

  if (error) {
    console.error(error);
    alert("익명 제보 저장 중 오류가 발생했습니다.");
    return;
  }

  alert("익명 제보가 정상적으로 접수되었습니다.");
  document.getElementById("anonymousReportForm").reset();
});
