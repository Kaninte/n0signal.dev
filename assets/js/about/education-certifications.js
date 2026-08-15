(() => {
  const source =
    document.getElementById("about-page-content") ||
    document.querySelector(".about-page.education-certifications");

  if (!source) return;

  source.classList.add("is-processing");

  const META_KEYS = ["Institution", "Status", "Type", "Completed"];

  const parseMetaText = (text) => {
    const meta = {};
    const pattern = /(Institution|Status|Type|Completed):\s*(.*?)(?=\s+(?:Institution|Status|Type|Completed):|$)/g;

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

  const splitSubjectGrade = (li, showCheckboxes) => {
    const checkbox = li.querySelector('input[type="checkbox"]');
    const raw = (li.textContent || "").trim();
    const match = raw.match(/^(.*?)\s+-\s+(HD|DN|CR|PS|FL)$/i);

    const name = match ? match[1].trim() : raw;
    const grade = match ? match[2].toUpperCase() : "";

    if (!showCheckboxes && checkbox) {
      checkbox.remove();
    }

    Array.from(li.childNodes).forEach((node) => {
      if (node !== checkbox || !showCheckboxes) {
        if (node.nodeType !== Node.ELEMENT_NODE || node !== checkbox) {
          node.remove();
        }
      }
    });

    if (showCheckboxes && checkbox && !checkbox.isConnected) {
      li.prepend(checkbox);
    }

    const nameSpan = document.createElement("span");
    nameSpan.className = "subject-name";
    nameSpan.textContent = name;
    li.appendChild(nameSpan);

    const gradeSpan = document.createElement("span");
    gradeSpan.className = "subject-grade";

    if (grade) {
      gradeSpan.dataset.grade = grade;
      gradeSpan.textContent = grade;
      gradeSpan.setAttribute("aria-label", `Grade ${grade}`);
    } else {
      gradeSpan.textContent = "—";
      gradeSpan.setAttribute("aria-label", "No grade recorded");
    }

    li.appendChild(gradeSpan);
  };

  const addSubjectHeader = (stage, showCheckboxes) => {
    const list = stage.querySelector(":scope > ul");
    if (!list || stage.querySelector(":scope > .about-subject-head")) return;

    const head = document.createElement("div");
    head.className = "about-subject-head";

    if (showCheckboxes) {
      const blank = document.createElement("span");
      blank.setAttribute("aria-hidden", "true");
      head.appendChild(blank);
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
  let recordMeta = null;
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

    const isComplete = (meta.Status || "").toUpperCase() === "COMPLETE";
    const isInProgress = (meta.Status || "").toUpperCase() === "IN PROGRESS";

    record.classList.toggle("is-complete", isComplete);
    record.classList.toggle("is-in-progress", isInProgress);

    const status = record.querySelector(".about-record-status");

    if (status) {
      if (meta.Status) status.textContent = meta.Status;
      else status.remove();
    }

    const fields = [
      ["Institution", meta.Institution],
      ["Type", meta.Type],
      ["Completed", meta.Completed],
    ];

    const dl = document.createElement("dl");
    dl.className = "about-record-meta";

    for (const [label, value] of fields) {
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

    const stages = Array.from(recordBody.querySelectorAll(":scope > .about-study-stage"));

    for (const stageEl of stages) {
      const list = stageEl.querySelector(":scope > ul");

      if (list) {
        list.querySelectorAll(":scope > li").forEach((li) => {
          splitSubjectGrade(li, !isComplete);
        });

        addSubjectHeader(stageEl, !isComplete);
      }
    }

    if (stages.length) {
      const details = document.createElement("div");
      details.className = "about-record-details";
      details.hidden = true;

      stages.forEach((stageEl) => details.appendChild(stageEl));
      recordBody.appendChild(details);

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "about-record-toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", `Expand ${record.querySelector(".about-record-title")?.textContent || "record"}`);

      const detailsId = `about-record-details-${Math.random().toString(36).slice(2, 9)}`;
      details.id = detailsId;
      toggle.setAttribute("aria-controls", detailsId);

      toggle.addEventListener("click", () => {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        details.hidden = expanded;

        const title = record.querySelector(".about-record-title")?.textContent || "record";
        toggle.setAttribute("aria-label", `${expanded ? "Expand" : "Collapse"} ${title}`);
      });

      record.querySelector(".about-record-head")?.appendChild(toggle);
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
        const value = (node.textContent || "").replace(/^Completed:\s*/, "").trim();
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
