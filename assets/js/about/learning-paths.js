(() => {
  const source =
    document.getElementById("about-record-source") ||
    document.getElementById("about-page-content") ||
    document.querySelector(".about-page.learning-paths");

  if (!source) return;

  source.classList.add("learning-source", "is-processing");

  const nodes = Array.from(source.children);
  const fragment = document.createDocumentFragment();

  let platform = null;
  let grid = null;
  let path = null;
  let pathBody = null;

  const getTask = (li) => {
    const checkbox = li.querySelector('input[type="checkbox"]');
    if (checkbox) {
      return {
        checked: checkbox.checked,
        name: (li.textContent || "").trim()
      };
    }

    const text = (li.textContent || "").trim();
    const match = text.match(/^\[(x| )\]\s*(.*)$/i);
    return match
      ? { checked: match[1].toLowerCase() === "x", name: match[2].trim() }
      : { checked: false, name: text };
  };

  const parseMeta = (container) => {
    const meta = {
      status: "",
      description: ""
    };

    for (const p of Array.from(container.children).filter(el => el.tagName === "P")) {
      const text = (p.textContent || "").trim();

      const statusMatch = text.match(/^Status:\s*(.*)$/i);
      const descriptionMatch = text.match(/^Description:\s*(.*)$/i);

      if (statusMatch) {
        meta.status = statusMatch[1].trim();
        p.remove();
        continue;
      }

      if (descriptionMatch) {
        meta.description = descriptionMatch[1].trim();
        p.remove();
        continue;
      }

      // Kept in Markdown for consistency, but progress is derived from tasks.
      if (/^Completed:\s*/i.test(text)) {
        p.remove();
      }
    }

    return meta;
  };

  const finishPath = () => {
    if (!path || !pathBody) return;

    const meta = parseMeta(pathBody);
    const status = meta.status;
    const statusUpper = status.toUpperCase();

    const originalList = pathBody.querySelector(":scope > ul");
    const items = originalList
      ? Array.from(originalList.querySelectorAll(":scope > li")).map(getTask)
      : [];

    const total = items.length;
    const done = items.filter(item => item.checked).length;
    const percent = total ? Math.round((done / total) * 100) : 0;

    const isComplete =
      statusUpper === "COMPLETE" ||
      (total > 0 && done === total && statusUpper !== "IN PROGRESS");

    path.classList.toggle("is-complete", isComplete);
    path.classList.toggle("is-in-progress", !isComplete);

    const titleEl = path.querySelector(".learning-path-title");
    const title = titleEl?.textContent?.trim() || "Learning path";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "learning-path-toggle";
    button.setAttribute("aria-expanded", "false");

    const head = document.createElement("div");
    head.className = "learning-path-head";

    const statusEl = document.createElement("span");
    statusEl.className = "learning-path-status";
    statusEl.textContent = status || (isComplete ? "COMPLETE" : "IN PROGRESS");

    head.append(titleEl, statusEl);

    const description = meta.description
      ? document.createElement("p")
      : null;

    if (description) {
      description.className = "learning-path-description";
      description.textContent = meta.description;
    }

    const progress = document.createElement("div");
    progress.className = "learning-progress";

    const count = document.createElement("span");
    count.className = "learning-progress-count";
    count.textContent = `${done} / ${total} ${total === 1 ? "item" : "items"}`;

    const track = document.createElement("span");
    track.className = "learning-progress-track";

    const fill = document.createElement("span");
    fill.className = "learning-progress-fill";
    fill.style.setProperty("--learning-progress", `${percent}%`);
    track.appendChild(fill);

    const percentEl = document.createElement("span");
    percentEl.className = "learning-progress-percent";
    percentEl.textContent = `${percent}%`;

    const caret = document.createElement("span");
    caret.className = "learning-path-caret";
    caret.setAttribute("aria-hidden", "true");

    progress.append(count, track, percentEl, caret);
    button.append(head);
    if (description) button.append(description);
    button.append(progress);

    const details = document.createElement("div");
    details.className = "learning-path-details";
    details.hidden = true;

    const detailsId = "learning-path-" + Math.random().toString(36).slice(2, 9);
    details.id = detailsId;
    button.setAttribute("aria-controls", detailsId);
    button.setAttribute("aria-label", `Expand ${title}`);

    if (items.length) {
      const list = document.createElement("ul");
      list.className = "learning-path-list";

      for (const item of items) {
        const li = document.createElement("li");
        li.className = "learning-path-item";
        if (item.checked) li.classList.add("is-done");

        const check = document.createElement("span");
        check.className = "learning-check";
        check.setAttribute("aria-hidden", "true");

        const name = document.createElement("span");
        name.className = "learning-item-name";
        name.textContent = item.name;

        li.append(check, name);
        list.appendChild(li);
      }

      details.appendChild(list);
    } else {
      const empty = document.createElement("p");
      empty.className = "learning-empty";
      empty.textContent = "No checklist items yet.";
      details.appendChild(empty);
    }

    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      details.hidden = expanded;
      button.setAttribute(
        "aria-label",
        `${expanded ? "Expand" : "Collapse"} ${title}`
      );
    });

    pathBody.replaceChildren(button, details);
    path = null;
    pathBody = null;
  };

  const startPlatform = (heading) => {
    finishPath();

    platform = document.createElement("section");
    platform.className = "learning-platform";

    const platformHead = document.createElement("div");
    platformHead.className = "learning-platform-head";

    heading.className = "learning-platform-title";
    platformHead.appendChild(heading);
    platform.appendChild(platformHead);

    grid = document.createElement("div");
    grid.className = "learning-path-grid";
    platform.appendChild(grid);

    fragment.appendChild(platform);
  };

  const startPath = (heading) => {
    finishPath();
    if (!grid) return;

    path = document.createElement("article");
    path.className = "learning-path";

    heading.className = "learning-path-title";

    pathBody = document.createElement("div");
    pathBody.className = "learning-path-body";
    pathBody.appendChild(heading);

    path.appendChild(pathBody);
    grid.appendChild(path);
  };

  for (const node of nodes) {
    const tag = node.tagName;

    if (tag === "H2") {
      startPlatform(node);
      continue;
    }

    if (
      platform &&
      !path &&
      tag === "P" &&
      /^Account:\s*/i.test((node.textContent || "").trim())
    ) {
      const account = (node.textContent || "")
        .replace(/^Account:\s*/i, "")
        .trim();

      const accountEl = document.createElement("p");
      accountEl.className = "learning-platform-account";

      const label = document.createElement("span");
      label.textContent = "Account: ";

      const value = document.createElement("strong");
      value.textContent = account || "—";

      accountEl.append(label, value);
      platform.querySelector(".learning-platform-head")?.appendChild(accountEl);
      continue;
    }

    if (tag === "H3") {
      startPath(node);
      continue;
    }

    if (pathBody) {
      pathBody.appendChild(node);
      continue;
    }

    if (platform) {
      platform.appendChild(node);
      continue;
    }

    fragment.appendChild(node);
  }

  finishPath();

  source.replaceChildren(fragment);
  source.classList.remove("is-processing");
})();
