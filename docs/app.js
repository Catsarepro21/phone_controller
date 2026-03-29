let activeUrl = null;
let activeName = null;
let pingInterval = null;
let isStreaming = false;

// ── WebSocket Mouse Control ─────────────────────────────────────
let mouseWs = null;
let pendingDx = 0;
let pendingDy = 0;
let lastTouch = null;
let trackpad = null;

function connectMouseWs(url) {
    if (mouseWs) { mouseWs.close(); mouseWs = null; }
    const wsUrl = url.replace(/^https/, 'wss').replace(/^http/, 'ws') + '/ws/mouse';
    mouseWs = new WebSocket(wsUrl);
    mouseWs.onclose = () => { mouseWs = null; };
    mouseWs.onerror = () => { mouseWs = null; };
}

function setupTrackpad() {
    trackpad = document.getElementById("trackpad");
    if(!trackpad) return;

    trackpad.addEventListener("touchstart", (e) => {
        if(e.touches.length === 1) {
            lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }, {passive: false});

    trackpad.addEventListener("touchmove", (e) => {
        e.preventDefault();
        if(e.touches.length === 1 && lastTouch) {
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            pendingDx += (currentX - lastTouch.x);
            pendingDy += (currentY - lastTouch.y);
            lastTouch = { x: currentX, y: currentY };
        }
    }, {passive: false});

    trackpad.addEventListener("touchend", () => {
        lastTouch = null;
    });

    // Send accumulated deltas over WebSocket - no new connections per move
    setInterval(() => {
        if ((Math.abs(pendingDx) > 0 || Math.abs(pendingDy) > 0) && mouseWs && mouseWs.readyState === WebSocket.OPEN) {
            mouseWs.send(JSON.stringify({ dx: pendingDx, dy: pendingDy }));
            pendingDx = 0;
            pendingDy = 0;
        }
    }, 30);
}

document.addEventListener("DOMContentLoaded", () => {
    renderPCList();
    setupTrackpad();
});

// ── Remote API Calls ──────────────────────────────────────────
async function sendMouseMove(dx, dy) {
    if (!activeUrl) return;
    try {
        await fetch(`${activeUrl}/mouse/move`, {
            method: "POST", headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ dx, dy })
        });
    } catch(e) {}
}

async function sendClick(button) {
    if (!activeUrl) return;
    if(window.navigator.vibrate) window.navigator.vibrate(20);
    try { await fetch(`${activeUrl}/mouse/click?button=${button}`, {method: "POST"}); } catch(e) {}
}

async function sendKey(key) {
    if (!activeUrl) return;
    if(window.navigator.vibrate) window.navigator.vibrate(20);
    try { await fetch(`${activeUrl}/keyboard/press?key=${key}`, {method: "POST"}); } catch(e) {}
}

async function sendText() {
    if (!activeUrl) return;
    if(window.navigator.vibrate) window.navigator.vibrate(20);
    const kbText = document.getElementById("kbText");
    const text = kbText.value;
    if(!text) return;
    
    kbText.placeholder = "Typing on PC...";
    try {
        await fetch(`${activeUrl}/keyboard/write`, {
            method: "POST", headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ text })
        });
        kbText.value = "";
    } catch(e) {
        alert("Failed to send text. PC Offline.");
    }
    kbText.placeholder = "Type here — live on PC...";
}

let _prevKbValue = "";
function sendLiveKey(e) {
    if (!mouseWs || mouseWs.readyState !== WebSocket.OPEN) return;
    const cur = e.target.value;
    const prev = _prevKbValue;
    if (cur.length > prev.length) {
        const added = cur.slice(prev.length);
        for (const ch of added) {
            mouseWs.send(JSON.stringify({ type: "key", char: ch }));
        }
    } else if (cur.length < prev.length) {
        mouseWs.send(JSON.stringify({ type: "key", char: "backspace" }));
    }
    // Always clear the box so it acts like a transparent keyboard passthrough
    e.target.value = "";
    _prevKbValue = "";
}


// ── Connection Status & PC Management ─────────────────────────
function loadPCs() { return JSON.parse(localStorage.getItem("pcList") || "[]"); }
function savePCs(pcs) { localStorage.setItem("pcList", JSON.stringify(pcs)); }

function renderPCList() {
    const pcs = loadPCs();
    const container = document.getElementById("pcList");
    container.innerHTML = "";
    if (pcs.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 text-center py-2">No devices mapped yet.</p>`;
        return;
    }
    pcs.forEach((pc, i) => {
        const isActive = activeUrl === pc.url;
        const card = document.createElement("div");
        card.className = `device-card flex items-center justify-between p-3 rounded-xl cursor-pointer border ${isActive ? "active" : "border-white/5 bg-white/5 hover:bg-white/10"}`;
        card.innerHTML = `
            <div onclick="selectPC('${pc.url}', '${pc.name}')" class="flex-1 flex items-center gap-3">
                <div class="${isActive ? 'bg-blue-500' : 'bg-slate-600'} w-2 h-2 rounded-full"></div>
                <div>
                    <p class="font-semibold text-sm ${isActive ? 'text-white' : 'text-slate-200'}">${pc.name}</p>
                    <p class="text-[10px] text-slate-400 font-mono mt-0.5">${pc.url.replace(/^https?:\/\//, '')}</p>
                </div>
            </div>
            <button onclick="removePC(${i}); event.stopPropagation();" class="p-2 text-slate-500 hover:text-red-400 rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
        `;
        container.appendChild(card);
    });
}

function selectPC(url, name) {
    activeUrl = url;
    activeName = name;
    document.getElementById("activeLabel").textContent = name;
    document.getElementById("statusBanner").classList.remove("hidden");
    document.getElementById("sysStats").classList.add("hidden");
    document.getElementById("controls").classList.remove("hidden");
    
    renderPCList();
    updateStatusIndicator('checking');
    if (isStreaming) toggleStream();
    
    connectMouseWs(url);
    startHealthCheck();
}

function removePC(index) {
    const pcs = loadPCs();
    const removingActive = pcs[index].url === activeUrl;
    pcs.splice(index, 1);
    savePCs(pcs);
    
    if (removingActive) {
        activeUrl = null;
        activeName = null;
        document.getElementById("controls").classList.add("hidden");
        document.getElementById("statusBanner").classList.add("hidden");
        document.getElementById("sysStats").classList.add("hidden");
        if (pingInterval) clearInterval(pingInterval);
    }
    renderPCList();
}

function openAddPCModal() {
    const modal = document.getElementById("addPCModal");
    const content = document.getElementById("modalContent");
    modal.classList.remove("hidden");
    setTimeout(() => { modal.classList.remove("opacity-0"); content.classList.remove("scale-95"); }, 10);
}
function closeAddPCModal() {
    const modal = document.getElementById("addPCModal");
    const content = document.getElementById("modalContent");
    modal.classList.add("opacity-0"); content.classList.add("scale-95");
    setTimeout(() => { modal.classList.add("hidden"); }, 300);
}
function addPC() {
    const name = document.getElementById("pcName").value.trim();
    let url = document.getElementById("pcUrl").value.trim();
    if (!name || !url) return alert("Please enter both a name and URL.");
    if (!url.startsWith("http")) url = "http://" + url;
    url = url.replace(/\/$/, ""); 
    const pcs = loadPCs();
    pcs.push({ name, url });
    savePCs(pcs);
    closeAddPCModal();
    renderPCList();
}

// ── Health Check & UI States ──────────────────────────────────
function updateStatusIndicator(status) {
    const dot = document.getElementById("statusIndicator");
    const label = document.getElementById("activeLabel");
    dot.className = "status-dot transition-colors duration-300";
    if (status === 'online') {
        dot.classList.add("status-online");
        label.textContent = `${activeName} (Online)`;
        label.className = "font-medium text-emerald-400";
    } else if (status === 'offline') {
        dot.classList.add("status-offline");
        label.textContent = `${activeName} (Offline)`;
        label.className = "font-medium text-red-400";
        document.getElementById("sysStats").classList.add("hidden");
    } else {
        dot.classList.add("status-checking");
        label.textContent = `Connecting to ${activeName}...`;
        label.className = "font-medium text-amber-400 animate-pulse";
    }
}

async function checkPCHealth() {
    if (!activeUrl) return;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${activeUrl}/ping`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (res.ok) {
            updateStatusIndicator('online');
            
            // Get rich system stats
            try {
                const statRes = await fetch(`${activeUrl}/stats`);
                const stats = await statRes.json();
                document.getElementById('sysStats').classList.remove('hidden');
                document.getElementById('cpuVal').textContent = stats.cpu + '%';
                document.getElementById('ramVal').textContent = stats.ram + '%';
            } catch(e) {}
            
        } else {
            updateStatusIndicator('offline');
        }
    } catch (e) {
        updateStatusIndicator('offline');
        if (isStreaming) toggleStream();
    }
}

function startHealthCheck() {
    if (pingInterval) clearInterval(pingInterval);
    checkPCHealth();
    pingInterval = setInterval(checkPCHealth, 5000);
}

// ── Actions & Stream ──────────────────────────────────────────
async function doAction(action) {
    if (!activeUrl) return;
    if (action === "shutdown" && !confirm("Are you sure?")) return;
    try {
        const res = await fetch(`${activeUrl}/${action}`, { method: "POST" });
        const data = await res.json();
        if(window.navigator.vibrate) window.navigator.vibrate(50);
        alert(data.message || data.status);
    } catch (e) { alert("Action failed."); }
}

function toggleStream() {
    if (!activeUrl) return;
    const container = document.getElementById("videoContainer");
    const stream = document.getElementById("videoStream");
    const btn = document.getElementById("streamBtn");
    const loader = document.getElementById("streamLoader");
    const badge = document.getElementById("streamStatusBadge");

    if (!isStreaming) {
        if(document.getElementById("statusIndicator").classList.contains("status-offline")) return alert("PC is offline.");
        container.classList.remove("hidden");
        loader.classList.remove("hidden");
        stream.classList.add("hidden");
        
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            loader.classList.add("hidden");
            stream.src = img.src;
            stream.classList.remove("hidden");
            badge.classList.remove("hidden");
        };
        img.onerror = () => { toggleStream(); alert("Stream failed."); };
        img.src = `${activeUrl}/stream?t=${Date.now()}`;

        btn.textContent = "Close Screen";
        btn.classList.replace("bg-blue-600/80", "bg-slate-700/80");
        btn.classList.replace("border-blue-500/50", "border-slate-500/50");
    } else {
        stream.src = "";
        container.classList.add("hidden");
        stream.classList.add("hidden");
        loader.classList.add("hidden");
        badge.classList.add("hidden");
        
        btn.textContent = "Connect Screen";
        btn.classList.replace("bg-slate-700/80", "bg-blue-600/80");
        btn.classList.replace("border-slate-500/50", "border-blue-500/50");
    }
    isStreaming = !isStreaming;
}

// ── File Sharing ──────────────────────────────────────────────
function updateFileName() {
    const input = document.getElementById("fileInput");
    document.getElementById("fileLabel").textContent = input.files.length > 0 ? input.files[0].name : "Select File";
}

async function uploadFile() {
    if (!activeUrl || !document.getElementById("fileInput").files[0]) return;
    const btn = document.getElementById("uploadBtn");
    btn.innerHTML = '<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>';
    const form = new FormData();
    form.append("file", document.getElementById("fileInput").files[0]);

    try {
        const res = await fetch(`${activeUrl}/upload`, { method: "POST", body: form });
        if ((await res.json()).status === "success") {
            listFiles();
            document.getElementById("fileInput").value = "";
            updateFileName();
        } else alert("Upload failed.");
    } catch(e) { alert("Upload error."); } finally { btn.textContent = "Upload"; }
}

async function listFiles() {
    if (!activeUrl) return;
    const list = document.getElementById("fileList");
    list.innerHTML = `<li class="text-slate-500 text-center py-2 animate-pulse">Loading...</li>`;
    try {
        const res = await fetch(`${activeUrl}/list_files`);
        const data = await res.json();
        list.innerHTML = "";
        if (!data.files || data.files.length === 0) { list.innerHTML = `<li class="text-slate-500 text-center py-2">No files yet</li>`; return; }
        
        data.files.forEach(f => {
            const li = document.createElement("li");
            li.className = "flex justify-between items-center group bg-black/30 hover:bg-black/50 p-2 rounded-lg transition";
            li.innerHTML = `
                <span class="truncate pr-2" style="max-width:180px">${f}</span>
                <a href="${activeUrl}/download/${encodeURIComponent(f)}" class="bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white px-2 py-1 rounded transition text-[10px] uppercase font-bold" download>GET</a>
            `;
            list.appendChild(li);
        });
    } catch(e) { list.innerHTML = `<li class="text-red-400 text-center py-2">Device offline</li>`; }
}
