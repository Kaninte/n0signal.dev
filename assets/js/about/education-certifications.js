(() => {
  const source =
    document.getElementById("about-record-source") ||
    document.getElementById("about-page-content") ||
    document.querySelector(".about-page.education-certifications");

  if (!source) return;

  source.classList.add("is-processing");

  const META_KEYS = ["Institution", "Status", "Type", "Completed"];

  const parseMetaText = (text) => {
    const meta = {};
    const pattern =
      /(Institution|Status|Type|Completed):\s*(.*?)(?=\s+(?:Institution|Status|Type|Completed):|$)/g;

    for (const match of text.matchAll(pattern)) {
      meta[match[1]] = match[2].trim();
    }

    return meta;
  };

  const parseMetaNodes = (nodes) => {
    const meta = {};
    for (const node of nodes) {
      Object.assign(meta, parseMetaText((node.textContent || "").trim()));
    }
    return meta;
  };

  const formatSubjectRow = (li, showCheckbox) => {
    const originalCheckbox = li.querySelector('input[type="checkbox"]');
    const checked = originalCheckbox?.checked ?? false;

    const raw = (li.textContent || "").trim();
    const match = raw.match(/^(.*?)\s+-\s+(HD|DN|CR|PS|FL)$/i);

    const subjectName = match ? match[1].trim() : raw;
    const grade = match ? match[2].toUpperCase() : "";

    li.replaceChildren();
    li.classList.remove("task-list-item");

    if (showCheckbox) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = checked;
      checkbox.disabled = true;
      checkbox.className = "about-progress-check";
      checkbox.setAttribute(
        "aria-label",
        `${checked ? "Completed" : "Not completed"}: ${subjectName}`
      );
      li.appendChild(checkbox);
    }

    const name = document.createElement("span");
    name.className = "subject-name";
    name.textContent = subjectName;
    li.appendChild(name);

    const gradeEl = document.createElement("span");
    gradeEl.className = "subject-grade";

    if (grade) {
      gradeEl.dataset.grade = grade;
      gradeEl.textContent = grade;
      gradeEl.setAttribute("aria-label", `Grade ${grade}`);
    } else {
      gradeEl.textContent = "—";
      gradeEl.setAttribute("aria-label", "No grade recorded");
    }

    li.appendChild(gradeEl);
  };

  const addSubjectHeader = (stage, showCheckbox) => {
    const list = stage.querySelector(":scope > ul");
    if (!list || stage.querySelector(":scope > .about-subject-head")) return;

    const head = document.createElement("div");
    head.className = "about-subject-head";

    if (showCheckbox) {
      const progress = document.createElement("span");
      progress.setAttribute("aria-hidden", "true");
      head.appendChild(progress);
    }

    const subject = document.createElement("span");
    subject.textContent = "Subject";

    const grade = document.createElement("span");
    grade.textContent = "Grade";

    head.append(subject, grade);
    list.before(head);
  };

  const children = Array.from(source.children);
  const fragment = document.createDocumentFragment();

  let section = null;
  let record = null;
  let recordBody = null;
  let stage = null;

  const makeSection = (heading) => {
    const el = document.createElement("section");
    el.className = "about-record-section";

    const head = document.createElement("div");
    head.className = "about-record-section-header";

    heading.className = "";
    head.appendChild(heading);
    el.appendChild(head);

    fragment.appendChild(el);
    return el;
  };

  const finishRecord = () => {
    if (!record || !recordBody) return;

    const metaNodes = Array.from(recordBody.children).filter((el) => {
      if (el.tagName !== "P") return false;
      return META_KEYS.some((key) => (el.textContent || "").includes(`${key}:`));
    });

    const meta = parseMetaNodes(metaNodes);
    metaNodes.forEach((node) => node.remove());

    if (meta.Type) record.dataset.type = meta.Type;

    const statusValue = (meta.Status || "").toUpperCase();
    const isComplete = statusValue === "COMPLETE";
    const isInProgress = statusValue === "IN PROGRESS";

    record.classList.toggle("is-complete", isComplete);
    record.classList.toggle("is-in-progress", isInProgress);

    const status = record.querySelector(".about-record-status");
    if (status) {
      if (meta.Status) status.textContent = meta.Status;
      else status.remove();
    }

    const dl = document.createElement("dl");
    dl.className = "about-record-meta";

    for (const [label, value] of [
      ["Institution", meta.Institution],
      ["Type", meta.Type],
      ["Completed", meta.Completed],
    ]) {
      if (label === "Completed" && !value) continue;

      const item = document.createElement("div");
      item.className = "about-record-meta-item";

      const dt = document.createElement("dt");
      dt.textContent = label;

      const dd = document.createElement("dd");
      dd.textContent = value || "—";
      if (!value) dd.classList.add("is-empty");

      item.append(dt, dd);
      dl.appendChild(item);
    }

    recordBody.prepend(dl);

    const stages = Array.from(
      recordBody.querySelectorAll(":scope > .about-study-stage")
    );

    for (const stageEl of stages) {
      const list = stageEl.querySelector(":scope > ul");

      if (list) {
        list.querySelectorAll(":scope > li").forEach((li) => {
          formatSubjectRow(li, isInProgress);
        });
        addSubjectHeader(stageEl, isInProgress);
      }
    }

    const title =
      record.querySelector(".about-record-title")?.textContent || "record";

    if (stages.length) {
      const details = document.createElement("div");
      details.className = "about-record-details";
      details.hidden = true;

      stages.forEach((stageEl) => details.appendChild(stageEl));
      recordBody.appendChild(details);

      const summary = document.createElement("button");
      summary.type = "button";
      summary.className = "about-record-summary";
      summary.setAttribute("aria-expanded", "false");
      summary.setAttribute("aria-label", `Expand ${title}`);

      const detailsId =
        "about-record-details-" + Math.random().toString(36).slice(2, 9);
      details.id = detailsId;
      summary.setAttribute("aria-controls", detailsId);

      const head = record.querySelector(".about-record-head");
      const metaList = recordBody.querySelector(":scope > .about-record-meta");

      const caret = document.createElement("span");
      caret.className = "about-record-caret";
      caret.setAttribute("aria-hidden", "true");
      head?.appendChild(caret);

      if (head) summary.appendChild(head);
      if (metaList) summary.appendChild(metaList);

      summary.addEventListener("click", () => {
        const expanded = summary.getAttribute("aria-expanded") === "true";
        summary.setAttribute("aria-expanded", String(!expanded));
        details.hidden = expanded;
        summary.setAttribute(
          "aria-label",
          `${expanded ? "Expand" : "Collapse"} ${title}`
        );
      });

      recordBody.prepend(summary);
    }

    record = null;
    recordBody = null;
    stage = null;
  };

  const startRecord = (heading) => {
    if (!section) return;

    finishRecord();

    record = document.createElement("article");
    record.className = "about-record";

    const head = document.createElement("div");
    head.className = "about-record-head";

    heading.className = "about-record-title";

    const status = document.createElement("span");
    status.className = "about-record-status";

    head.append(heading, status);

    recordBody = document.createElement("div");
    recordBody.className = "about-record-body";

    record.append(head, recordBody);
    section.appendChild(record);

    stage = null;
  };

  const startStage = (heading) => {
    if (!recordBody) return;

    stage = document.createElement("section");
    stage.className = "about-study-stage";

    const head = document.createElement("div");
    head.className = "about-study-stage-head";

    heading.className = "about-study-stage-title";

    const date = document.createElement("span");
    date.className = "about-study-stage-date";

    head.append(heading, date);
    stage.appendChild(head);
    recordBody.appendChild(stage);
  };

  for (const node of children) {
    const tag = node.tagName;

    if (tag === "H2") {
      finishRecord();
      section = makeSection(node);
      continue;
    }

    if (tag === "H3") {
      startRecord(node);
      continue;
    }

    if (tag === "H4") {
      startStage(node);
      continue;
    }

    if (stage) {
      if (tag === "P" && /^Completed:/.test((node.textContent || "").trim())) {
        const value = (node.textContent || "")
          .replace(/^Completed:\s*/, "")
          .trim();

        const date = stage.querySelector(".about-study-stage-date");
        if (date) date.textContent = value ? `Completed ${value}` : "";
        continue;
      }

      stage.appendChild(node);
      continue;
    }

    if (recordBody) {
      recordBody.appendChild(node);
      continue;
    }

    if (section) {
      section.appendChild(node);
      continue;
    }

    fragment.appendChild(node);
  }

  finishRecord();

  source.replaceChildren(fragment);
  source.classList.remove("is-processing");
})();
