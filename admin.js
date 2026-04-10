const SUPABASE_URL = "https://fnmfclvplcmymbzofvef.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2Nf7DTmz7fO-GZCcyJBZlQ_ZV7WSJOj";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentAdmin = null;

document.getElementById("loadAllComplaintsBtn").addEventListener("click", async function () {
  if (!currentAdmin) {
    alert("먼저 관리자 로그인하세요.");
    return;
  }

  const listEl = document.getElementById("adminComplaintsList");
  listEl.innerHTML = '<p class="help">불러오는 중...</p>';

  const { data: complaints, error: complaintsError } = await supabaseClient
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false });

  if (complaintsError) {
    console.error(complaintsError);
    listEl.innerHTML = '<p class="help">전체 접수내역을 불러오는 중 오류가 발생했습니다.</p>';
    return;
  }

  if (!complaints || complaints.length === 0) {
    listEl.innerHTML = '<p class="help">접수된 내역이 없습니다.</p>';
    return;
  }

  const userIds = [...new Set(
    complaints
      .map(item => item.user_id)
      .filter(Boolean)
  )];

  let profileMap = {};

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select("id, name")
      .in("id", userIds);

    if (profilesError) {
      console.error(profilesError);
    } else {
      profileMap = Object.fromEntries(
        profiles.map(profile => [profile.id, profile.name])
      );
    }
  }

  listEl.innerHTML = complaints.map(item => {
    const createdAt = item.created_at
      ? new Date(item.created_at).toLocaleString("ko-KR")
      : "-";

    const submissionTypeText =
      item.submission_type === "anonymous_report" ? "익명 제보" : "일반 고충";

    const writerName =
      item.submission_type === "anonymous_report"
        ? "익명"
        : (profileMap[item.user_id] || "이름확인불가");

    return `
      <div class="complaint-item">
        <h3>${item.title || ""}</h3>
        <div class="complaint-meta">
          <span>구분: ${submissionTypeText}</span>
          <span>유형: ${item.category || "-"}</span>
          <span>상태: ${item.status || "-"}</span>
          <span>접수일시: ${createdAt}</span>
          <span>작성자: ${writerName}</span>
        </div>

        <p class="complaint-content">${item.content || ""}</p>

        <div class="complaint-meta" style="margin-top:12px;">
          <select onchange="updateComplaintStatus('${item.id}', this.value)">
            <option value="">상태 변경</option>
            <option value="접수됨">접수됨</option>
            <option value="검토중">검토중</option>
            <option value="조치완료">조치완료</option>
            <option value="반려">반려</option>
            <option value="숨김">숨김</option>
          </select>
        </div>

        ${item.admin_comment ? `<p class="complaint-content"><strong>관리자 의견:</strong> ${item.admin_comment}</p>` : ""}
      </div>
    `;
  }).join("");
});

async function updateComplaintStatus(id, status) {
  if (!currentAdmin) {
    alert("먼저 관리자 로그인하세요.");
    return;
  }

  if (!status) return;

  const { error } = await supabaseClient
    .from("complaints")
    .update({
      status: status,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("상태 변경 중 오류가 발생했습니다.");
    return;
  }

  alert("상태가 변경되었습니다.");
}

document.getElementById("loadAllComplaintsBtn").addEventListener("click", async function () {
  if (!currentAdmin) {
    alert("먼저 관리자 로그인하세요.");
    return;
  }

  const listEl = document.getElementById("adminComplaintsList");
  listEl.innerHTML = '<p class="help">불러오는 중...</p>';

  const { data: complaints, error: complaintsError } = await supabaseClient
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false });

  if (complaintsError) {
    console.error(complaintsError);
    listEl.innerHTML = '<p class="help">전체 접수내역을 불러오는 중 오류가 발생했습니다.</p>';
    return;
  }

  if (!complaints || complaints.length === 0) {
    listEl.innerHTML = '<p class="help">접수된 내역이 없습니다.</p>';
    return;
  }

  const userIds = [...new Set(
    complaints
      .map(item => item.user_id)
      .filter(Boolean)
  )];

  let profileMap = {};

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select("id, name")
      .in("id", userIds);

    if (profilesError) {
      console.error(profilesError);
    } else {
      profileMap = Object.fromEntries(
        profiles.map(profile => [profile.id, profile.name])
      );
    }
  }

  listEl.innerHTML = complaints.map(item => {
    const createdAt = item.created_at
      ? new Date(item.created_at).toLocaleString("ko-KR")
      : "-";

    const submissionTypeText =
      item.submission_type === "anonymous_report" ? "익명 제보" : "일반 고충";

    const writerName =
      item.submission_type === "anonymous_report"
        ? "익명"
        : (profileMap[item.user_id] || "이름확인불가");

    return `
      <div class="complaint-item">
        <h3>${item.title || ""}</h3>
        <div class="complaint-meta">
          <span>구분: ${submissionTypeText}</span>
          <span>유형: ${item.category || "-"}</span>
          <span>상태: ${item.status || "-"}</span>
          <span>접수일시: ${createdAt}</span>
          <span>작성자: ${writerName}</span>
        </div>
        <p class="complaint-content">${item.content || ""}</p>
        ${item.admin_comment ? `<p class="complaint-content"><strong>관리자 의견:</strong> ${item.admin_comment}</p>` : ""}
      </div>
    `;
  }).join("");
});
