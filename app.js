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
document.getElementById("loadMyComplaintsBtn").addEventListener("click", async function () {
  if (!currentUser) {
    alert("먼저 로그인하세요.");
    return;
  }

  const listEl = document.getElementById("myComplaintsList");
  listEl.innerHTML = '<p class="help">불러오는 중...</p>';

  const { data, error } = await supabaseClient
    .from("complaints")
    .select("*")
    .eq("user_id", currentUser.id)
    .eq("submission_type", "general")
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    listEl.innerHTML = '<p class="help">내 접수내역을 불러오는 중 오류가 발생했습니다.</p>';
    return;
  }

  if (!data || data.length === 0) {
    listEl.innerHTML = '<p class="help">접수된 내역이 없습니다.</p>';
    return;
  }

  listEl.innerHTML = data.map(item => {
    const anonymousText = item.is_anonymous ? "익명" : "실명";
    const createdAt = item.created_at
      ? new Date(item.created_at).toLocaleString("ko-KR")
      : "-";

    return `
      <div class="complaint-item">
        <h3>${item.title || ""}</h3>
        <div class="complaint-meta">
          <span>유형: ${item.category || "-"}</span>
          <span>상태: ${item.status || "-"}</span>
          <span>작성방식: ${anonymousText}</span>
          <span>접수일시: ${createdAt}</span>
        </div>
        <p class="complaint-content">${item.content || ""}</p>
        ${item.admin_comment ? `<p class="complaint-content"><strong>관리자 의견:</strong> ${item.admin_comment}</p>` : ""}
      </div>
    `;
  }).join("");
});
