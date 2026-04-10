const SUPABASE_URL = "https://fnmfclvplcmymbzofvef.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2Nf7DTmz7fO-GZCcyJBZlQ_ZV7WSJOj";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentAdmin = null;

document.getElementById("adminLoginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const adminId = document.getElementById("adminId").value.trim();
  const adminPassword = document.getElementById("adminPassword").value.trim();
  const statusEl = document.getElementById("adminLoginStatus");

  if (!adminId || !adminPassword) {
    alert("관리자 아이디와 비밀번호를 입력하세요.");
    return;
  }

  const { data, error } = await supabaseClient
    .from("admin_accounts")
    .select("*")
    .eq("admin_id", adminId)
    .eq("password", adminPassword)
    .eq("is_active", true)
    .limit(1);

  if (error) {
    console.error(error);
    statusEl.textContent = "로그인 중 오류가 발생했습니다.";
    return;
  }

  if (!data || data.length === 0) {
    statusEl.textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
    return;
  }

  currentAdmin = data[0];
  statusEl.textContent = `${currentAdmin.name} 관리자 로그인 완료`;
});

document.getElementById("loadAllComplaintsBtn").addEventListener("click", async function () {
  if (!currentAdmin) {
    alert("먼저 관리자 로그인하세요.");
    return;
  }

  await loadAllComplaints();
});

async function loadAllComplaints() {
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

    const hiddenText = item.is_hidden ? "숨김됨" : "표시중";

    return `
      <div class="complaint-item">
        <h3>${item.title || ""}</h3>
        <div class="complaint-meta">
          <span>구분: ${submissionTypeText}</span>
          <span>유형: ${item.category || "-"}</span>
          <span>상태: ${item.status || "-"}</span>
          <span>표시상태: ${hiddenText}</span>
          <span>접수일시: ${createdAt}</span>
          <span>작성자: ${writerName}</span>
        </div>

        <p class="complaint-content">${item.content || ""}</p>

        <div style="margin-top:12px;">
          <label>관리자 의견</label>
          <textarea id="comment-${item.id}" rows="4" placeholder="관리자 의견을 입력하세요">${item.admin_comment || ""}</textarea>
          <button type="button" onclick="saveAdminComment('${item.id}')">의견 저장</button>
        </div>

        <div class="complaint-meta" style="margin-top:12px;">
          <select onchange="updateComplaintStatus('${item.id}', this.value)">
            <option value="">상태 변경</option>
            <option value="접수됨" ${item.status === "접수됨" ? "selected" : ""}>접수됨</option>
            <option value="검토중" ${item.status === "검토중" ? "selected" : ""}>검토중</option>
            <option value="조치완료" ${item.status === "조치완료" ? "selected" : ""}>조치완료</option>
            <option value="반려" ${item.status === "반려" ? "selected" : ""}>반려</option>
            <option value="숨김" ${item.status === "숨김" ? "selected" : ""}>숨김</option>
          </select>

          <button type="button" onclick="hideComplaint('${item.id}')">숨김 처리</button>
          <button type="button" onclick="unhideComplaint('${item.id}')">숨김 해제</button>
        </div>
      </div>
    `;
  }).join("");
}

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
  await loadAllComplaints();
}

async function saveAdminComment(id) {
  if (!currentAdmin) {
    alert("먼저 관리자 로그인하세요.");
    return;
  }

  const comment = document.getElementById(`comment-${id}`).value.trim();

  const { error } = await supabaseClient
    .from("complaints")
    .update({
      admin_comment: comment,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("관리자 의견 저장 중 오류가 발생했습니다.");
    return;
  }

  alert("관리자 의견이 저장되었습니다.");
  await loadAllComplaints();
}

async function hideComplaint(id) {
  if (!currentAdmin) {
    alert("먼저 관리자 로그인하세요.");
    return;
  }

  const { error } = await supabaseClient
    .from("complaints")
    .update({
      is_hidden: true,
      status: "숨김",
      hidden_at: new Date().toISOString(),
      hidden_by: currentAdmin.admin_id,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("숨김 처리 중 오류가 발생했습니다.");
    return;
  }

  alert("숨김 처리되었습니다.");
  await loadAllComplaints();
}

async function unhideComplaint(id) {
  if (!currentAdmin) {
    alert("먼저 관리자 로그인하세요.");
    return;
  }

  const { error } = await supabaseClient
    .from("complaints")
    .update({
      is_hidden: false,
      hidden_at: null,
      hidden_by: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("숨김 해제 중 오류가 발생했습니다.");
    return;
  }

  alert("숨김 해제되었습니다.");
  await loadAllComplaints();
}
