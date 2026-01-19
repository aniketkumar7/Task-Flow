(() => {
  const STORAGE_KEY = "taskflow.tasks.v2";
  const THEME_KEY = "theme";

  /** @typedef {{id:number,title:string,notes:string,project?:string,priority:"low"|"medium"|"high",dueDate:string,dueTime:string,done:boolean,createdAt:string,updatedAt:string}} Task */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const els = {
    themeToggle: $("#themeToggle"),
    themeIcon: $("#themeIcon"),

    quickAddForm: $("#quickAddForm"),
    quickAddInput: $("#quickAddInput"),
    addBtn: $("#addBtn"),
    notesInput: $("#notesInput"),
    priorityInput: $("#priorityInput"), // legacy (may not exist)
    dueInput: $("#dueInput"),
    timeInput: $("#timeInput"),
    timeDropdown: $("#timeDropdown"),
    timeBtn: $("#timeBtn"),
    timeMenu: $("#timeMenu"),
    timeValue: $("#timeValue"),
    timeHour: $("#timeHour"),
    timeMinute: $("#timeMinute"),
    timeAM: $("#timeAM"),
    timePM: $("#timePM"),
    timeClear: $("#timeClear"),

    priorityDropdown: $("#priorityDropdown"),
    priorityBtn: $("#priorityBtn"),
    priorityMenu: $("#priorityMenu"),
    priorityValue: $("#priorityValue"),

    dueDropdown: $("#dueDropdown"),
    dueBtn: $("#dueBtn"),
    dueMenu: $("#dueMenu"),
    dueValue: $("#dueValue"),
    dueGrid: $("#dueGrid"),
    dueMonth: $("#dueMonth"),
    duePrev: $("#duePrev"),
    dueNext: $("#dueNext"),
    dueToday: $("#dueToday"),
    dueClear: $("#dueClear"),

    filterBtns: $$(".seg-btn"),
    searchInput: $("#searchInput"),
    priorityFilterDropdown: $("#priorityFilterDropdown"),
    priorityFilterBtn: $("#priorityFilterBtn"),
    priorityFilterMenu: $("#priorityFilterMenu"),
    priorityFilterValue: $("#priorityFilterValue"),

    taskList: $("#taskList"),
    emptyState: $("#emptyState"),
    counts: $("#counts"), // legacy (removed)
    countAll: $("#countAll"),
    countActive: $("#countActive"),
    countDone: $("#countDone"),
    clearDoneBtn: $("#clearDoneBtn"),
    resetBtn: $("#resetBtn"),

    editDialog: $("#editDialog"),
    editForm: $("#editForm"),
    editTitle: $("#editTitle"),
    editNotes: $("#editNotes"),
    editPriority: $("#editPriority"), // legacy (may not exist)
    editDue: $("#editDue"),
    editTime: $("#editTime"),
    editTimeDropdown: $("#editTimeDropdown"),
    editTimeBtn: $("#editTimeBtn"),
    editTimeMenu: $("#editTimeMenu"),
    editTimeValue: $("#editTimeValue"),
    editTimeHour: $("#editTimeHour"),
    editTimeMinute: $("#editTimeMinute"),
    editTimeAM: $("#editTimeAM"),
    editTimePM: $("#editTimePM"),
    editTimeClear: $("#editTimeClear"),

    editPriorityDropdown: $("#editPriorityDropdown"),
    editPriorityBtn: $("#editPriorityBtn"),
    editPriorityMenu: $("#editPriorityMenu"),
    editPriorityValue: $("#editPriorityValue"),

    editDueDropdown: $("#editDueDropdown"),
    editDueBtn: $("#editDueBtn"),
    editDueMenu: $("#editDueMenu"),
    editDueValue: $("#editDueValue"),
    editDueGrid: $("#editDueGrid"),
    editDueMonth: $("#editDueMonth"),
    editDuePrev: $("#editDuePrev"),
    editDueNext: $("#editDueNext"),
    editDueToday: $("#editDueToday"),
    editDueClear: $("#editDueClear"),

    confirmDialog: $("#confirmDialog"),
    confirmForm: $("#confirmForm"),
    confirmTitle: $("#confirmTitle"),
    confirmText: $("#confirmText"),
    confirmSub: $("#confirmSub"),
    confirmOk: $("#confirmOk"),
  };

  /** @type {{ tasks: Task[], filter: "all"|"active"|"done", q: string, priority: "all"|"low"|"medium"|"high", editingId: number|null, confirm: null | { type: "deleteTask"|"clearDone"|"resetAll", taskId?: number } }} */
  const state = {
    tasks: [],
    filter: "all",
    q: "",
    priority: "all",
    editingId: null,
    confirm: null,
  };
  const PRIORITY_LABEL = {
    high: "Priority: High",
    medium: "Priority: Medium",
    low: "Priority: Low",
  };

  const PRIORITY_FILTER_LABEL = {
    all: "Priority: All",
    high: "Priority: High",
    medium: "Priority: Medium",
    low: "Priority: Low",
  };

  function nowIso() {
    return new Date().toISOString();
  }

  function safeJsonParse(str) {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  function normalizeTask(input) {
    const t = /** @type {any} */ (input ?? {});
    const id = typeof t.id === "number" ? t.id : Date.now();
    const title = String(t.title ?? "").trim();
    const notes = String(t.notes ?? t.description ?? "").trim();
    const project = String(t.project ?? t.category ?? "").trim(); // kept for backward compatibility; not shown in UI
    const priorityRaw = String(t.priority ?? "medium").toLowerCase();
    const priority =
      priorityRaw === "high" || priorityRaw === "low" || priorityRaw === "medium" ? priorityRaw : "medium";
    const dueDate = String(t.dueDate ?? "").trim(); // YYYY-MM-DD
    const dueTime = String(t.dueTime ?? "").trim(); // HH:MM
    const done = Boolean(t.done ?? t.completed ?? false);
    const createdAt = typeof t.createdAt === "string" ? t.createdAt : nowIso();
    const updatedAt = typeof t.updatedAt === "string" ? t.updatedAt : createdAt;

    return { id, title, notes, project, priority, dueDate, dueTime, done, createdAt, updatedAt };
  }

  function migrateFromLegacyIfNeeded() {
    // v2 takes precedence
    const v2 = safeJsonParse(localStorage.getItem(STORAGE_KEY) || "");
    if (Array.isArray(v2)) return v2.map(normalizeTask).filter((t) => t.title.length);

    // legacy key from older version
    const legacy = safeJsonParse(localStorage.getItem("tasks") || "");
    if (!Array.isArray(legacy)) return [];

    const migrated = legacy
      .map((t) => normalizeTask(t))
      .filter((t) => t.title.length);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  }

  function load() {
    state.tasks = migrateFromLegacyIfNeeded();
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    els.themeIcon.textContent = theme === "dark" ? "☾" : "☀";
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const theme = saved || (prefersDark ? "dark" : "light");
    setTheme(theme);
  }

  function addTask(title, details) {
    const t = title.trim();
    if (!t) return;
    const task = /** @type {Task} */ ({
      id: Date.now(),
      title: t,
      notes: String(details?.notes || "").trim(),
      priority: details?.priority || "medium",
      dueDate: details?.dueDate || "",
      dueTime: details?.dueTime || "",
      done: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    state.tasks.unshift(task);
    save();
    render();
  }

  function updateTask(id, patch) {
    const idx = state.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    state.tasks[idx] = {
      ...state.tasks[idx],
      ...patch,
      updatedAt: nowIso(),
    };
    save();
    render();
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter((t) => t.id !== id);
    save();
    render();
  }

  function clearDone() {
    state.tasks = state.tasks.filter((t) => !t.done);
    save();
    render();
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    // keep legacy key clean too
    localStorage.removeItem("tasks");
    state.tasks = [];
    save();
    render();
  }

  function getVisibleTasks() {
    const q = state.q.trim().toLowerCase();
    let list = state.tasks.slice();

    if (state.filter === "active") list = list.filter((t) => !t.done);
    if (state.filter === "done") list = list.filter((t) => t.done);
    if (state.priority !== "all") list = list.filter((t) => t.priority === state.priority);

    if (q) {
      list = list.filter((t) => {
        const hay = `${t.title}\n${t.notes}`.toLowerCase();
        return hay.includes(q);
      });
    }

    return list;
  }

  function setCounts() {
    const total = state.tasks.length;
    const done = state.tasks.filter((t) => t.done).length;
    const active = total - done;
    if (els.counts) els.counts.textContent = `${total} total · ${active} active · ${done} done`;
    if (els.countAll) els.countAll.textContent = String(total);
    if (els.countActive) els.countActive.textContent = String(active);
    if (els.countDone) els.countDone.textContent = String(done);
    els.clearDoneBtn.disabled = done === 0;
  }

  function taskItemHtml(task) {
    const title = escapeHtml(task.title);
    const notes = task.notes ? escapeHtml(task.notes) : "";
    const dueIso = task.dueDate ? String(task.dueDate) : "";
    const dueTime = task.dueTime ? String(task.dueTime) : "";
    const priority = task.priority || "medium";
    const priorityLabel = priority === "high" ? "High" : priority === "low" ? "Low" : "Medium";
    const accent = priority;

    const formatTimeDisplay = (hhmm) => {
      const m = String(hhmm || "").match(/^(\d{1,2}):(\d{2})$/);
      if (!m) return "";
      let hh = Number(m[1]);
      const mm = m[2];
      const ampm = hh >= 12 ? "PM" : "AM";
      hh = hh % 12;
      if (hh === 0) hh = 12;
      return `${hh}:${mm} ${ampm}`;
    };

    const dueLabel = (() => {
      if (!dueIso) return "";
      const d = parseIsoDateLocal(dueIso);
      if (!d) return `Due: ${escapeHtml(dueIso)}`;
      if (Number.isNaN(d.getTime())) return `Due: ${escapeHtml(dueIso)}`;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.round((d - today) / (1000 * 60 * 60 * 24));
      const timeSuffix = dueTime ? ` ${formatTimeDisplay(dueTime)}` : "";
      if (diffDays === 0) return `Due: Today${timeSuffix}`;
      if (diffDays === 1) return `Due: Tomorrow${timeSuffix}`;
      if (diffDays === -1) return `Due: Yesterday${timeSuffix}`;
      const pretty = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return `Due: ${pretty}${dueTime ? ` ${formatTimeDisplay(dueTime)}` : ""}`;
    })();

    const dueState = (() => {
      if (!dueIso || task.done) return "";
      const d = parseIsoDateTimeLocal(dueIso, dueTime || "00:00");
      if (!d) return "";
      if (Number.isNaN(d.getTime())) return "";
      const now = new Date();
      const diffHours = (d - now) / (1000 * 60 * 60);
      if (diffHours < 0) return "overdue";
      if (diffHours <= 48) return "soon";
      return "";
    })();

    const iconCheck = `
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    const iconPencil = `
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <path d="M12 20h9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    const iconTrash = `
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <path d="M3 6h18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M8 6V4h8v2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6.5 6l1 15h9l1-15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 11v6M14 11v6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
      </svg>
    `;

    return `
      <li class="task" data-id="${task.id}" data-due="${dueState}">
        <div class="task-head">
          <div class="task-title ${task.done ? "is-done" : ""}">${title}</div>
          <div class="task-actions">
            <button class="icon-action toggle ${task.done ? "is-on" : ""}" type="button" data-action="toggle"
              aria-label="${task.done ? "Mark as not done" : "Mark as done"}" aria-pressed="${task.done ? "true" : "false"}">
              ${iconCheck}
            </button>
            <button class="icon-action" type="button" data-action="edit" aria-label="Edit task">
              ${iconPencil}
            </button>
            <button class="icon-action danger" type="button" data-action="delete" aria-label="Delete task">
              ${iconTrash}
            </button>
          </div>
        </div>

        <div class="task-meta">
          <span class="badge prio ${priority}">${priorityLabel}</span>
          ${dueLabel ? `<span class="badge due ${dueState}">${escapeHtml(dueLabel)}</span>` : ""}
        </div>

        ${notes ? `<div class="task-notes">${notes}</div>` : ""}
      </li>
    `;
  }

  function render() {
    const visible = getVisibleTasks();
    els.taskList.innerHTML = visible.map(taskItemHtml).join("");

    els.emptyState.classList.toggle("is-hidden", visible.length !== 0);
    setCounts();
  }

  function setPriorityUI(value, scope) {
    const label = PRIORITY_LABEL[value] || PRIORITY_LABEL.medium;
    if (scope === "edit") {
      if (els.editPriorityValue) els.editPriorityValue.textContent = label;
      if (els.editPriority) els.editPriority.value = value;
      for (const item of $$(".drop-item", els.editPriorityMenu)) {
        const isActive = item.dataset.value === value;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", isActive ? "true" : "false");
      }
      return;
    }

    if (els.priorityValue) els.priorityValue.textContent = label;
    if (els.priorityInput) els.priorityInput.value = value;
    for (const item of $$(".drop-item", els.priorityMenu)) {
      const isActive = item.dataset.value === value;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-selected", isActive ? "true" : "false");
    }
  }

  function openDropdown(dropdownEl, btnEl, menuEl) {
    if (!dropdownEl || !btnEl) return;
    dropdownEl.classList.add("is-open");
    btnEl.setAttribute("aria-expanded", "true");
    menuEl?.focus?.();
  }

  function closeDropdown(dropdownEl, btnEl) {
    if (!dropdownEl || !btnEl) return;
    dropdownEl.classList.remove("is-open");
    btnEl.setAttribute("aria-expanded", "false");
  }

  function toggleDropdown(dropdownEl, btnEl, menuEl) {
    if (!dropdownEl || !btnEl) return;
    const willOpen = !dropdownEl.classList.contains("is-open");
    if (willOpen) closeAllDropdowns();
    const isOpen = dropdownEl.classList.toggle("is-open");
    btnEl.setAttribute("aria-expanded", isOpen ? "true" : "false");
    if (isOpen) {
      setTimeout(() => positionFloatingMenu(btnEl, menuEl), 0);
      menuEl?.focus?.();
    }
  }

  function closeAllDropdowns() {
    closeDropdown(els.priorityDropdown, els.priorityBtn);
    closeDropdown(els.editPriorityDropdown, els.editPriorityBtn);
    closeDropdown(els.dueDropdown, els.dueBtn);
    closeDropdown(els.editDueDropdown, els.editDueBtn);
    closeDropdown(els.timeDropdown, els.timeBtn);
    closeDropdown(els.editTimeDropdown, els.editTimeBtn);
    closeDropdown(els.priorityFilterDropdown, els.priorityFilterBtn);
  }

  function fmtMonthLabel(year, monthIndex) {
    const d = new Date(year, monthIndex, 1);
    return d.toLocaleString(undefined, { month: "long", year: "numeric" });
  }

  function isoDateLocal(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function parseIsoDateLocal(iso) {
    const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mon = Number(m[2]) - 1;
    const d = Number(m[3]);
    return new Date(y, mon, d);
  }

  function parseIsoDateTimeLocal(dateIso, timeHHMM) {
    const d = parseIsoDateLocal(dateIso);
    if (!d) return null;
    const tm = String(timeHHMM || "").match(/^(\d{1,2}):(\d{2})$/);
    const hh = tm ? Number(tm[1]) : 0;
    const mm = tm ? Number(tm[2]) : 0;
    d.setHours(hh, mm, 0, 0);
    return d;
  }

  function fmtDueLabel(iso) {
    if (!iso) return "Due: None";
    return `Due: ${iso}`;
  }

  function fmtTimeLabel(hhmm) {
    if (!hhmm) return "Time: None";
    const m = String(hhmm).match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return `Time: ${hhmm}`;
    let hh = Number(m[1]);
    const mm = m[2];
    const ampm = hh >= 12 ? "PM" : "AM";
    hh = hh % 12;
    if (hh === 0) hh = 12;
    return `Time: ${hh}:${mm} ${ampm}`;
  }

  function setAmPmButtons(isEdit, hh24) {
    const amBtn = isEdit ? els.editTimeAM : els.timeAM;
    const pmBtn = isEdit ? els.editTimePM : els.timePM;
    if (!amBtn || !pmBtn) return;
    const m = String(hh24 || "").match(/^(\d{1,2}):(\d{2})$/);
    const isPm = m ? Number(m[1]) >= 12 : false;
    amBtn.classList.toggle("is-on", !isPm);
    pmBtn.classList.toggle("is-on", isPm);
    amBtn.setAttribute("aria-pressed", (!isPm).toString());
    pmBtn.setAttribute("aria-pressed", isPm.toString());
  }

  function positionFloatingMenu(btnEl, menuEl) {
    if (!btnEl || !menuEl) return;
    // menu is displayed when dropdown is open; position it within viewport
    menuEl.style.position = "fixed";
    menuEl.style.right = "auto";
    menuEl.style.left = "0px";
    menuEl.style.top = "0px";
    menuEl.style.maxWidth = `min(360px, calc(100vw - 24px))`;
    const isDate = menuEl.classList?.contains?.("date-menu");
    menuEl.style.maxHeight = isDate ? `calc(100vh - 24px)` : "none";
    menuEl.style.overflow = isDate ? "auto" : "visible";

    const rect = btnEl.getBoundingClientRect();
    const menuRect = menuEl.getBoundingClientRect();
    const pad = 12;

    // horizontal: align right edge to button right edge
    let left = rect.right - menuRect.width;
    left = Math.max(pad, Math.min(left, window.innerWidth - menuRect.width - pad));

    // vertical: prefer below, otherwise above
    let top = rect.bottom + 10;
    if (top + menuRect.height > window.innerHeight - pad) {
      top = rect.top - 10 - menuRect.height;
    }
    top = Math.max(pad, Math.min(top, window.innerHeight - menuRect.height - pad));

    menuEl.style.left = `${left}px`;
    menuEl.style.top = `${top}px`;
  }

  function buildCalendarGrid({ year, monthIndex, selectedIso, gridEl, onPick }) {
    // Monday-first calendar
    const first = new Date(year, monthIndex, 1);
    const last = new Date(year, monthIndex + 1, 0);
    const daysInMonth = last.getDate();
    const firstDay = (first.getDay() + 6) % 7; // convert Sun(0) -> 6

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, monthIndex, d));
    while (cells.length % 7 !== 0) cells.push(null);

    const selected = selectedIso ? parseIsoDateLocal(selectedIso) : null;
    const today = new Date();
    const todayIso = isoDateLocal(new Date(today.getFullYear(), today.getMonth(), today.getDate()));

    gridEl.innerHTML = cells
      .map((cell) => {
        if (!cell) return `<span class="day is-empty" aria-hidden="true"></span>`;
        const iso = isoDateLocal(cell);
        const isToday = iso === todayIso;
        const isSelected =
          selected &&
          cell.getFullYear() === selected.getFullYear() &&
          cell.getMonth() === selected.getMonth() &&
          cell.getDate() === selected.getDate();
        const cls = ["day"];
        if (isToday) cls.push("is-today");
        if (isSelected) cls.push("is-selected");
        return `<button type="button" class="${cls.join(" ")}" data-iso="${iso}">${cell.getDate()}</button>`;
      })
      .join("");

    gridEl.querySelectorAll("button.day").forEach((b) => {
      b.addEventListener("click", () => onPick(b.dataset.iso));
    });
  }

  function initDatePicker(scope) {
    const isEdit = scope === "edit";
    const dropdownEl = isEdit ? els.editDueDropdown : els.dueDropdown;
    const btnEl = isEdit ? els.editDueBtn : els.dueBtn;
    const menuEl = isEdit ? els.editDueMenu : els.dueMenu;
    const valueEl = isEdit ? els.editDueValue : els.dueValue;
    const inputEl = isEdit ? els.editDue : els.dueInput;
    const gridEl = isEdit ? els.editDueGrid : els.dueGrid;
    const monthEl = isEdit ? els.editDueMonth : els.dueMonth;
    const prevEl = isEdit ? els.editDuePrev : els.duePrev;
    const nextEl = isEdit ? els.editDueNext : els.dueNext;
    const todayEl = isEdit ? els.editDueToday : els.dueToday;
    const clearEl = isEdit ? els.editDueClear : els.dueClear;

    if (!dropdownEl || !btnEl || !menuEl || !valueEl || !inputEl || !gridEl || !monthEl) return;

    let view = (() => {
      const base = inputEl.value ? new Date(inputEl.value + "T00:00:00") : new Date();
      return { y: base.getFullYear(), m: base.getMonth() };
    })();

    const sync = () => {
      valueEl.textContent = fmtDueLabel(inputEl.value);
      monthEl.textContent = fmtMonthLabel(view.y, view.m);
      buildCalendarGrid({
        year: view.y,
        monthIndex: view.m,
        selectedIso: inputEl.value,
        gridEl,
        onPick: (iso) => {
          inputEl.value = iso;
          valueEl.textContent = fmtDueLabel(iso);
          closeDropdown(dropdownEl, btnEl);
        },
        });
    };

    btnEl.addEventListener("click", (e) => {
      e.preventDefault();
      // reset view to selected month each open
      view = (() => {
        const base = inputEl.value ? new Date(inputEl.value + "T00:00:00") : new Date();
        return { y: base.getFullYear(), m: base.getMonth() };
      })();
      toggleDropdown(dropdownEl, btnEl, menuEl);
      if (dropdownEl.classList.contains("is-open")) sync();
    });

    prevEl?.addEventListener("click", () => {
      view.m -= 1;
      if (view.m < 0) {
        view.m = 11;
        view.y -= 1;
      }
      sync();
    });

    nextEl?.addEventListener("click", () => {
      view.m += 1;
      if (view.m > 11) {
        view.m = 0;
        view.y += 1;
      }
      sync();
    });

    todayEl?.addEventListener("click", () => {
      const t = new Date();
      const iso = isoDateLocal(new Date(t.getFullYear(), t.getMonth(), t.getDate()));
      inputEl.value = iso;
      valueEl.textContent = fmtDueLabel(iso);
      closeDropdown(dropdownEl, btnEl);
    });

    clearEl?.addEventListener("click", () => {
      inputEl.value = "";
      valueEl.textContent = fmtDueLabel("");
      closeDropdown(dropdownEl, btnEl);
    });

    // initial
    valueEl.textContent = fmtDueLabel(inputEl.value);
  }

  function initTimePicker(scope) {
    const isEdit = scope === "edit";
    const dropdownEl = isEdit ? els.editTimeDropdown : els.timeDropdown;
    const btnEl = isEdit ? els.editTimeBtn : els.timeBtn;
    const menuEl = isEdit ? els.editTimeMenu : els.timeMenu;
    const valueEl = isEdit ? els.editTimeValue : els.timeValue;
    const inputEl = isEdit ? els.editTime : els.timeInput;
    const hourEl = isEdit ? els.editTimeHour : els.timeHour;
    const minuteEl = isEdit ? els.editTimeMinute : els.timeMinute;
    const clearEl = isEdit ? els.editTimeClear : els.timeClear;
    const amBtn = isEdit ? els.editTimeAM : els.timeAM;
    const pmBtn = isEdit ? els.editTimePM : els.timePM;

    if (!dropdownEl || !btnEl || !menuEl || !valueEl || !inputEl || !hourEl || !minuteEl) return;

    const parseStored = () => {
      const m = String(inputEl.value || "").match(/^(\d{1,2}):(\d{2})$/);
      if (!m) return null;
      return { hh24: Number(m[1]), mm: Number(m[2]) };
    };

    const setFromParts = () => {
      const hhRaw = String(hourEl.value || "").trim();
      const mmRaw = String(minuteEl.value || "").trim();
      if (!hhRaw && !mmRaw) {
        inputEl.value = "";
        valueEl.textContent = fmtTimeLabel("");
        setAmPmButtons(isEdit, "");
            return;
        }

      const hh = Number(hhRaw);
      const mm = Number(mmRaw);
      if (!Number.isFinite(hh) || !Number.isFinite(mm)) return;
      if (hh < 1 || hh > 12) return;
      if (mm < 0 || mm > 59) return;

      const isPm = pmBtn?.classList.contains("is-on");
      let hh24 = hh % 12;
      if (isPm) hh24 += 12;
      inputEl.value = `${String(hh24).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      valueEl.textContent = fmtTimeLabel(inputEl.value);
      setAmPmButtons(isEdit, inputEl.value);
    };

    const syncUIFromStored = () => {
      const stored = parseStored();
      if (!stored) {
        hourEl.value = "";
        minuteEl.value = "";
        valueEl.textContent = fmtTimeLabel("");
        setAmPmButtons(isEdit, "");
        return;
      }
      const isPm = stored.hh24 >= 12;
      let hh12 = stored.hh24 % 12;
      if (hh12 === 0) hh12 = 12;
      hourEl.value = String(hh12);
      minuteEl.value = String(stored.mm).padStart(2, "0");
      valueEl.textContent = fmtTimeLabel(inputEl.value);
      setAmPmButtons(isEdit, inputEl.value);
      // ensure button state matches stored
      if (amBtn && pmBtn) {
        amBtn.classList.toggle("is-on", !isPm);
        pmBtn.classList.toggle("is-on", isPm);
        amBtn.setAttribute("aria-pressed", (!isPm).toString());
        pmBtn.setAttribute("aria-pressed", isPm.toString());
      }
    };

    btnEl.addEventListener("click", (e) => {
      e.preventDefault();
      toggleDropdown(dropdownEl, btnEl, menuEl);
      if (dropdownEl.classList.contains("is-open")) {
        syncUIFromStored();
        setTimeout(() => hourEl.focus(), 0);
      }
    });

    const applyMeridiem = (wantPm) => {
      if (!amBtn || !pmBtn) return;
      amBtn.classList.toggle("is-on", !wantPm);
      pmBtn.classList.toggle("is-on", wantPm);
      amBtn.setAttribute("aria-pressed", (!wantPm).toString());
      pmBtn.setAttribute("aria-pressed", wantPm.toString());
      setFromParts();
    };

    amBtn?.addEventListener("click", () => applyMeridiem(false));
    pmBtn?.addEventListener("click", () => applyMeridiem(true));

    const onPartsInput = () => setFromParts();
    hourEl.addEventListener("input", onPartsInput);
    minuteEl.addEventListener("input", onPartsInput);

    clearEl?.addEventListener("click", () => {
      inputEl.value = "";
      hourEl.value = "";
      minuteEl.value = "";
      valueEl.textContent = fmtTimeLabel("");
      closeDropdown(dropdownEl, btnEl);
      btnEl.focus();
    });

    // initial
    valueEl.textContent = fmtTimeLabel(inputEl.value);
    setAmPmButtons(isEdit, inputEl.value);
  }

  function openConfirm(payload) {
    state.confirm = payload;
    if (els.confirmTitle) {
      els.confirmTitle.textContent =
        payload.type === "deleteTask" ? "Delete task" : payload.type === "clearDone" ? "Clear done" : "Reset";
    }
    if (els.confirmOk) {
      els.confirmOk.textContent =
        payload.type === "deleteTask" ? "Delete" : payload.type === "clearDone" ? "Clear" : "Reset";
    }
    if (els.confirmSub) els.confirmSub.textContent = "This action can’t be undone.";
    if (els.confirmText) {
      if (payload.type === "deleteTask") els.confirmText.textContent = payload.message;
      if (payload.type === "clearDone") els.confirmText.textContent = "Clear all completed tasks?";
      if (payload.type === "resetAll") els.confirmText.textContent = "Reset TaskFlow on this device?";
    }
    if (typeof els.confirmDialog?.showModal === "function") els.confirmDialog.showModal();
  }

  function closeConfirm() {
    state.confirm = null;
    if (els.confirmDialog?.open) els.confirmDialog.close();
  }

  function setFilter(next) {
    state.filter = next;
    for (const btn of els.filterBtns) {
      const isActive = btn.dataset.filter === next;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    }
    render();
  }

  function openEdit(id) {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    state.editingId = id;
    els.editTitle.value = task.title;
    els.editNotes.value = task.notes || "";
    if (els.editPriority) els.editPriority.value = task.priority || "medium";
    if (els.editDue) els.editDue.value = task.dueDate || "";
    if (els.editTime) els.editTime.value = task.dueTime || "";
    if (els.editTimeValue) els.editTimeValue.textContent = fmtTimeLabel(els.editTime.value || "");
    if (typeof els.editDialog.showModal === "function") els.editDialog.showModal();
    else alert("Your browser doesn't support the edit dialog. Please update your browser.");
    els.editTitle.focus();
    els.editTitle.select();
  }

  function closeEdit() {
    state.editingId = null;
    if (els.editDialog.open) els.editDialog.close();
  }

  function openConfirmDelete(id) {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    state.confirmingDeleteId = id;
    if (els.confirmText) {
      const title = task.title.length > 80 ? `${task.title.slice(0, 80)}…` : task.title;
      els.confirmText.textContent = `Delete “${title}”?`;
    }
    if (typeof els.confirmDialog?.showModal === "function") els.confirmDialog.showModal();
  }

  function closeConfirmDelete() {
    state.confirmingDeleteId = null;
    if (els.confirmDialog?.open) els.confirmDialog.close();
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // Events
  els.themeToggle.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(cur === "dark" ? "light" : "dark");
  });

  // add form validation
  const addErrorEl = document.getElementById("addError");
  const setAddError = (msg) => {
    if (addErrorEl) addErrorEl.textContent = msg || "";
    els.quickAddInput.toggleAttribute("aria-invalid", Boolean(msg));
    els.quickAddInput.classList.toggle("is-invalid", Boolean(msg));
  };

  const titleKey = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");

  const syncAddButton = () => {
    const ok = Boolean(els.quickAddInput.value.trim());
    if (els.addBtn) els.addBtn.disabled = !ok;
    if (ok) setAddError("");
  };

  els.quickAddInput.addEventListener("input", syncAddButton);
  syncAddButton();

  els.quickAddForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = els.quickAddInput.value.trim();
    if (!title) {
      setAddError("Title is required.");
      els.quickAddInput.focus();
      return;
    }
    const key = titleKey(title);
    const dup = state.tasks.some((t) => !t.done && titleKey(t.title) === key);
    if (dup) {
      setAddError("Duplicate task (already in your list).");
      els.quickAddInput.focus();
      return;
    }
    addTask(els.quickAddInput.value, {
      priority: els.priorityInput?.value || "medium",
      dueDate: els.dueInput?.value || "",
      dueTime: els.timeInput?.value || "",
      notes: els.notesInput?.value || "",
    });
    els.quickAddInput.value = "";
    if (els.priorityInput) els.priorityInput.value = "medium";
    if (els.dueInput) els.dueInput.value = "";
    if (els.timeInput) els.timeInput.value = "";
    if (els.notesInput) els.notesInput.value = "";
    setPriorityUI("medium");
    if (els.dueValue) els.dueValue.textContent = fmtDueLabel("");
    if (els.timeValue) els.timeValue.textContent = fmtTimeLabel("");
    if (els.addBtn) els.addBtn.disabled = true;
    els.quickAddInput.focus();
  });

  for (const btn of els.filterBtns) {
    btn.addEventListener("click", () => setFilter(btn.dataset.filter));
  }

  els.searchInput.addEventListener("input", () => {
    state.q = els.searchInput.value;
    render();
  });

  // priority filter dropdown (replaces sort)
  if (els.priorityFilterBtn && els.priorityFilterDropdown && els.priorityFilterMenu) {
    els.priorityFilterBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleDropdown(els.priorityFilterDropdown, els.priorityFilterBtn, els.priorityFilterMenu);
    });

    els.priorityFilterMenu.addEventListener("click", (e) => {
      const btn = e.target.closest(".drop-item");
      if (!btn) return;
      const val = btn.dataset.value;
      if (!val) return;
      state.priority = val;
      if (els.priorityFilterValue) els.priorityFilterValue.textContent = PRIORITY_FILTER_LABEL[val] || "Priority: All";
      for (const item of $$(".drop-item", els.priorityFilterMenu)) {
        const isActive = item.dataset.value === val;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", isActive ? "true" : "false");
      }
      closeDropdown(els.priorityFilterDropdown, els.priorityFilterBtn);
      render();
    });
  }

  // priority dropdowns
  if (els.priorityBtn && els.priorityDropdown && els.priorityMenu) {
    els.priorityBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleDropdown(els.priorityDropdown, els.priorityBtn, els.priorityMenu);
    });
    els.priorityMenu.addEventListener("click", (e) => {
      const btn = e.target.closest(".drop-item");
      if (!btn) return;
      const val = btn.dataset.value;
      if (!val) return;
      setPriorityUI(val);
      closeDropdown(els.priorityDropdown, els.priorityBtn);
      els.priorityBtn.focus();
    });
  }

  if (els.editPriorityBtn && els.editPriorityDropdown && els.editPriorityMenu) {
    els.editPriorityBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleDropdown(els.editPriorityDropdown, els.editPriorityBtn, els.editPriorityMenu);
    });
    els.editPriorityMenu.addEventListener("click", (e) => {
      const btn = e.target.closest(".drop-item");
      if (!btn) return;
      const val = btn.dataset.value;
      if (!val) return;
      setPriorityUI(val, "edit");
      closeDropdown(els.editPriorityDropdown, els.editPriorityBtn);
      els.editPriorityBtn.focus();
    });
  }

  // date pickers
  initDatePicker("add");
  initDatePicker("edit");
  initTimePicker("add");
  initTimePicker("edit");

  // close any open dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (e.target.closest(".dropdown")) return;
    closeAllDropdowns();
  });

  els.taskList.addEventListener("click", (e) => {
    const li = e.target.closest(".task");
    if (!li) return;
    const id = Number(li.dataset.id);
    if (!Number.isFinite(id)) return;

    const actionBtn = e.target.closest("[data-action]");
    if (actionBtn) {
      const action = actionBtn.dataset.action;
      if (action === "toggle") {
        const task = state.tasks.find((t) => t.id === id);
        if (!task) return;
        updateTask(id, { done: !task.done });
        return;
      }
      if (action === "edit") openEdit(id);
      if (action === "delete") {
        const task = state.tasks.find((t) => t.id === id);
        if (!task) return;
        const title = task.title.length > 80 ? `${task.title.slice(0, 80)}…` : task.title;
        openConfirm({ type: "deleteTask", taskId: id, message: `Delete “${title}”?` });
      }
      return;
    }
  });

  els.clearDoneBtn.addEventListener("click", () => {
    const done = state.tasks.some((t) => t.done);
    if (!done) return;
    openConfirm({ type: "clearDone" });
  });

  els.resetBtn.addEventListener("click", () => {
    openConfirm({ type: "resetAll" });
  });

  els.editForm.addEventListener("submit", (e) => {
    // method="dialog" submits on any button; use submitter.value to decide
    const submitter = e.submitter;
    const val = submitter?.value || "cancel";
    if (val !== "save") {
      closeEdit();
      return;
    }

    e.preventDefault();
    const id = state.editingId;
    if (!id) return;
    const title = els.editTitle.value.trim();
    if (!title) {
      els.editTitle.focus();
      return;
    }
    updateTask(id, {
      title,
      notes: els.editNotes.value.trim(),
      priority: els.editPriority?.value || "medium",
      dueDate: els.editDue?.value || "",
      dueTime: els.editTime?.value || "",
    });
    closeEdit();
  });

  if (els.confirmForm) {
    els.confirmForm.addEventListener("submit", (e) => {
      const submitter = e.submitter;
      const val = submitter?.value || "cancel";
      if (val !== "confirm") {
        closeConfirm();
        return;
      }
      e.preventDefault();
      const c = state.confirm;
      if (!c) return;
      if (c.type === "deleteTask" && c.taskId) deleteTask(c.taskId);
      if (c.type === "clearDone") clearDone();
      if (c.type === "resetAll") resetAll();
      closeConfirm();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllDropdowns();
      closeConfirm();
    }
    if (e.key === "/" && document.activeElement !== els.searchInput) {
      e.preventDefault();
      els.searchInput.focus();
      return;
    }
    if (e.key.toLowerCase() === "n" && document.activeElement !== els.quickAddInput) {
      // avoid hijacking typing in inputs/textareas/dialog
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      e.preventDefault();
      els.quickAddInput.focus();
    }
  });

  // Init
  initTheme();
  load();
  setPriorityUI("medium");
  render();
})();


