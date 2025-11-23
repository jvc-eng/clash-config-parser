async function loadNodes() {
  const res = await fetch("/functions/list");
  const j = await res.json();

  const list = document.getElementById("nodes");
  list.innerHTML = "";

  if (!j.nodes || j.nodes.length === 0) {
    document.getElementById("empty").style.display = "";
  } else {
    document.getElementById("empty").style.display = "none";
  }

  j.nodes.forEach(n => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${n.name}</span>
      <button data-del="${n.name}">删除</button>
    `;
    list.appendChild(li);
  });
}

document.getElementById("uploadBtn").onclick = async () => {
  const files = document.getElementById("files").files;
  if (!files.length) return alert("请选择文件");

  const fd = new FormData();
  [...files].forEach(f => fd.append("files", f));  // ★ 字段名必须是 files

  document.getElementById("status").innerText = "上传中...";

  const res = await fetch("/functions/upload", { method: "POST", body: fd });
  const j = await res.json();

  if (j.ok) {
    document.getElementById("status").innerText = "上传成功，当前节点：" + j.total;
    loadNodes();
  } else {
    document.getElementById("status").innerText = "错误：" + j.msg;
  }
};

document.getElementById("nodes").onclick = async e => {
  const name = e.target.dataset.del;
  if (!name) return;

  if (!confirm("删除节点 " + name + "?")) return;

  await fetch("/functions/delete?name=" + encodeURIComponent(name), { method: "POST" });
  loadNodes();
};

document.getElementById("copyBtn").onclick = () => {
  navigator.clipboard.writeText(location.origin + "/functions/sub");
  alert("已复制订阅链接");
};

window.onload = () => {
  loadNodes();
  document.getElementById("subLink").innerText = location.origin + "/functions/sub";
};

