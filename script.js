const SECTIONS = [
      { keyword: "final qa",        label: "*FINAL QA*" },
      { keyword: "feedback to dev", label: "*FEEDBACK TO DEV*" },
      { keyword: "deploy request",  label: "*DEPLOY REQUEST*" },
      { keyword: "on going qa",     label: "*ON GOING QA*" },
      { keyword: "filed feedback",  label: "*FILED FEEDBACK*" },
      { keyword: "on queue for qa", label: "*ON QUEUE FOR QA*" },
      { keyword: "closed",           label: "*CLOSED*" },
      { keyword: "rejected",          label: "*REJECTED*" },
      { keyword: "on hold",           label: "*ON HOLD*" },
      { keyword: "specs review",       label: "*SPECS REVIEW*" },
    ];

    function toggleTheme() {
      const html = document.documentElement;
      const isDark = html.getAttribute('data-theme') === 'dark';
      html.setAttribute('data-theme', isDark ? 'light' : 'dark');
      document.getElementById('themeBtn').textContent = isDark ? '🌙 Dark' : '☀️ Light';
      localStorage.setItem('theme', isDark ? 'light' : 'dark');
    }

    // Apply saved theme on load
    (function() {
      const saved = localStorage.getItem('theme') || 'light';
      document.documentElement.setAttribute('data-theme', saved);
      window.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('themeBtn');
        if (btn) btn.textContent = saved === 'dark' ? '☀️ Light' : '🌙 Dark';
      });
    })();

    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    let dpDate = new Date();
    let dpSelected = new Date();

    function initDate() {
      dpSelected = new Date();
      dpDate = new Date();
      setHiddenDate(dpSelected);
      updateDisplay(dpSelected);
      document.getElementById('datepickerDisplay').style.color = '';
      renderCalendar();
    }

    function setHiddenDate(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      document.getElementById('reportDate').value = `${y}-${m}-${day}`;
    }

    function updateDisplay(d) {
      document.getElementById('datepickerDisplay').textContent =
        `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }

    function togglePicker() {
      document.getElementById('datepickerDropdown').classList.toggle('open');
    }

    function changeMonth(dir) {
      dpDate.setMonth(dpDate.getMonth() + dir);
      renderCalendar();
    }

    function renderCalendar() {
      const y = dpDate.getFullYear();
      const m = dpDate.getMonth();
      document.getElementById('dpMonthYear').textContent = `${MONTHS[m]} ${y}`;

      const firstDay = new Date(y, m, 1).getDay();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const today = new Date();
      const container = document.getElementById('dpDays');
      container.innerHTML = '';

      for (let i = 0; i < firstDay; i++) {
        const el = document.createElement('div');
        el.className = 'dp-day empty';
        container.appendChild(el);
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const el = document.createElement('div');
        el.className = 'dp-day';
        el.textContent = d;
        const thisDate = new Date(y, m, d);
        if (today.toDateString() === thisDate.toDateString()) el.classList.add('today');
        if (dpSelected && dpSelected.toDateString() === thisDate.toDateString()) el.classList.add('selected');
        el.onclick = () => selectDay(y, m, d);
        container.appendChild(el);
      }
    }

    function selectDay(y, m, d) {
      dpSelected = new Date(y, m, d);
      dpDate = new Date(y, m, d);
      setHiddenDate(dpSelected);
      updateDisplay(dpSelected);
      renderCalendar();
      document.getElementById('datepickerDropdown').classList.remove('open');
    }

    function selectToday() {
      const today = new Date();
      selectDay(today.getFullYear(), today.getMonth(), today.getDate());
    }

    function clearDate() {
      dpSelected = null;
      document.getElementById('reportDate').value = '';
      document.getElementById('datepickerDisplay').textContent = 'Select date';
      document.getElementById('datepickerDisplay').style.color = 'var(--text3)';
      renderCalendar();
      document.getElementById('datepickerDropdown').classList.remove('open');
    }

    // Close picker when clicking outside
    document.addEventListener('click', (e) => {
      if (!document.getElementById('datepickerWrap').contains(e.target)) {
        document.getElementById('datepickerDropdown').classList.remove('open');
      }
    });

    function buildSectionRows() {
      const container = document.getElementById('sectionRows');
      SECTIONS.forEach((s, i) => {
        const row = document.createElement('div');
        row.className = 'srow';
        row.innerHTML = `<span class="srow-key">${s.keyword}</span><input type="text" id="label_${i}" value="${s.label}" />`;
        container.appendChild(row);
      });
    }

    function getLabels() {
      const base = SECTIONS.map((s, i) => ({
        keyword: s.keyword.toLowerCase(),
        label: document.getElementById(`label_${i}`).value || `*${s.keyword.toUpperCase()}*`
      }));

      return base;
    }

    function extractProjectName(line) {
      let m = line.match(/^\d{1,2}:\d{2}\s*(?:AM|PM)\s+(.+?)\s+(?:\d+\.\d+\s+hours?\s+\()?(?:Feature|Feedback|Bug|QA|Documentation|Support|Task)\s+#/i);
      if (!m) m = line.match(/^\d{1,2}:\d{2}\s*(?:AM|PM)\s+(\w[\w\s&]+?)\s+(?:Documentation|Support|Research\s*&\s*Dev|QA|Task)\s+#/i);
      if (!m) return null;
      const raw = m[1].trim();

      // Case 1: "ProjectName (Online) : SubProject_vX" — has colon separator
      const colonM = raw.match(/^(.+?)\s+\([^)]+\)\s*:\s*(.+?)(?:_v[\d.]+[a-z]?)?$/i);
      if (colonM) {
        const base = colonM[1].replace(/\s+Web$/i, '').trim();
        const sub = colonM[2].trim();
        return `${base} - ${sub}`;
      }

      // Case 2: "ProjectName (EnvName)_vX" — env name is sub-project if not generic
      const parenM = raw.match(/^(.+?)\s+\(([^)]+)\)[_\w.]*$/i);
      if (parenM) {
        const base = parenM[1].replace(/\s+Web$/i, '').trim();
        const env = parenM[2].trim();
        if (/^(?:Online|Offline|Staging)$/i.test(env)) return base;
        const envLabel = env.replace(/Online-Retirement/i, 'Biz Retirement');
        return `${base} - ${envLabel}`;
      }

      // Fallback
      return raw
        .replace(/\s*\([^)]*\)[_\w.]*$/i, '')
        .replace(/\s+(?:Documentation|Support|Research\s*&\s*Dev|QA|Bug|Feature|Feedback|Task)$/i, '')
        .replace(/_[A-Za-z]+$/, '')
        .replace(/\s+Web$/i, '')
        .trim();
    }

    function isActivityLine(line) {
      // Valid activity lines start with a timestamp: "HH:MM AM/PM"
      return /^\d{1,2}:\d{2}\s*(?:AM|PM)\s+/i.test(line);
    }

    function parseActivity(raw) {
      const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
      const itemMap = {};  // key → item, for dedup + status update
      const itemOrder = []; // preserve first-seen order
      const issueRe = /(Feature|Feedback|Bug|Documentation|Support|Research\s*&\s*Dev|Task|QA)\s+#(\d+)(?:\s*\(([^)]+)\))?:\s*(.+)/i;

      for (const line of lines) {
        if (!isActivityLine(line)) continue;
        const m = line.match(issueRe);
        if (!m) continue;
        const type = m[1];
        const num = m[2];
        const statusRaw = (m[3] || '').trim();
        const isHourWrap = /\d+\.\d+\s+hours?\s+\(/i.test(line);
        let title = m[4].trim();
        if (isHourWrap && title.endsWith(')')) {
          // Only strip the trailing ) if parens are unbalanced (outer wrapper's closing paren)
          const opens = (title.match(/\(/g) || []).length;
          const closes = (title.match(/\)/g) || []).length;
          if (closes > opens) title = title.slice(0, -1).trim();
        }
        const key = `${type.toLowerCase()}#${num}`;
        const project = extractProjectName(line) || '__unknown__';

        if (!itemMap[key]) {
          itemMap[key] = { type, num, statusRaw, title, project, fromHourWrap: isHourWrap };
          itemOrder.push(key);
        } else if (statusRaw) {
          if (itemMap[key].fromHourWrap && !isHourWrap) {
            itemMap[key].statusRaw = statusRaw;
            itemMap[key].fromHourWrap = false;
          } else if (!itemMap[key].statusRaw) {
            itemMap[key].statusRaw = statusRaw;
          }
        }
      }
      return itemOrder.map(k => itemMap[k]);
    }

    // Maps exact Redmine status tags → EOD section labels
    const STATUS_MAP = {
      'final qa':      '*FINAL QA*',
      'deploy request':'*DEPLOY REQUEST*',
      'new':           '*FILED FEEDBACK*',
      'qa process':    '*ON GOING QA*',
      'in progress':   '*ON GOING QA*',
      'feedback':      '*FEEDBACK TO DEV*',
      'on queue':      '*ON QUEUE FOR QA*',
      'closed':        '*CLOSED*',
      'rejected':      '*REJECTED*',
      'on hold':       '*ON HOLD*',
      'specs review':  '*SPECS REVIEW*',
      'qa request':    '*FEEDBACK TO DEV*',
    };

    function classifyStatus(statusRaw, labels) {
      const s = statusRaw.toLowerCase().trim();

      for (const [tag, section] of Object.entries(STATUS_MAP)) {
        if (s === tag || s.includes(tag)) {
          const match = labels.find(l => l.label === section);
          return match ? match.label : section;
        }
      }

      for (const l of labels) {
        if (s.includes(l.keyword)) return l.label;
      }

      // Unknown or no status — default to Feedback to Dev
      const feedbackLabel = labels.find(l => l.label === '*FEEDBACK TO DEV*');
      return feedbackLabel ? feedbackLabel.label : labels[0].label;
    }

    function formatDate(dateStr) {
      const [y, m, d] = dateStr.split('-');
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
    }

    function generate() {
      const raw = document.getElementById('input').value;
      const dateVal = document.getElementById('reportDate').value;
      const labels = getLabels();


      if (!raw.trim()) {
        document.getElementById('outputBlocks').innerHTML = '<span class="empty-state" style="font-style:italic; color:var(--text3); font-size:13px;">Walang input. I-paste muna ang Redmine activity text.</span>';
        return;
      }

      const allItems = parseActivity(raw);

      if (!allItems.length) {
        document.getElementById('outputBlocks').innerHTML = '<span class="empty-state" style="font-style:italic; color:var(--text3); font-size:13px;">Walang nahanap. Check mo kung tama ang na-copy na text.</span>';
        return;
      }

      // Group items by project, preserving first-seen order
      const projectOrder = [];
      const byProject = {};
      for (const item of allItems) {
        const p = item.project;
        if (!byProject[p]) {
          byProject[p] = {};
          projectOrder.push(p);
          for (const l of labels) byProject[p][l.label] = [];
        }
        const sec = classifyStatus(item.statusRaw, labels);
        if (!byProject[p][sec]) byProject[p][sec] = [];
        byProject[p][sec].push(item);
      }

      const sectionOrder = labels.map(l => l.label);
      const dateStr = dateVal ? formatDate(dateVal) : formatDate(new Date().toISOString().split('T')[0]);

      let total = 0;
      const blocks = [];

      for (const project of projectOrder) {
        const displayProject = project === '__unknown__' ? '(Unknown Project)' : project;
        let block = `QA Updates
As of ${dateStr}
${displayProject}

`;

        for (const sec of sectionOrder) {
          const secItems = byProject[project][sec] || [];
          if (secItems.length) {
            block += `${sec}\n`;
            for (const item of secItems) {
              block += `- ${item.type} #${item.num}: ${item.title}\n`;
              total++;
            }
            block += `\n`;
          }
        }
        blocks.push(block.trim() + '\n\nThank you');
      }

      const container = document.getElementById('outputBlocks');
      container.innerHTML = '';
      blocks.forEach((block, i) => {
        const card = document.createElement('div');
        card.className = 'project-block';
        const lines = block.split('\n');
        const firstLine = lines[0];
        const restText = lines.slice(1).join('\n');

        const toprow = document.createElement('div');
        toprow.className = 'project-block-toprow';

        const firstLineEl = document.createElement('span');
        firstLineEl.className = 'project-block-firstline';
        firstLineEl.textContent = firstLine;

        const copyBtn = document.createElement('button');
        copyBtn.className = 'project-block-copy';
        copyBtn.textContent = 'Copy';
        copyBtn.onclick = () => copyBlock(i);

        toprow.appendChild(firstLineEl);
        toprow.appendChild(copyBtn);

        const restEl = document.createElement('div');
        restEl.className = 'project-block-rest';
        restEl.id = `block_${i}`;
        const asOf = lines[1] || '';
        const projTitle = lines[2] || '';
        const bodyText = lines.slice(3).join('\n');
        const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        restEl.innerHTML = (asOf ? `<b>${esc(asOf)}</b>\n` : '') + (projTitle ? `<b>${esc(projTitle)}</b>\n` : '') + esc(bodyText);

        const contentEl = document.createElement('div');
        contentEl.className = 'project-block-content';
        contentEl.appendChild(toprow);
        contentEl.appendChild(restEl);
        card.appendChild(contentEl);
        container.appendChild(card);
      });
      document.getElementById('countBadge').textContent = `${total} item${total !== 1 ? 's' : ''}`;
      document.getElementById('reminder').style.display = blocks.length ? 'block' : 'none';
    }

    function copyBlock(i) {
      const restEl = document.getElementById(`block_${i}`);
      const firstLine = restEl.closest('.project-block-content').querySelector('.project-block-firstline').textContent;
      const text = firstLine + '\n' + restEl.textContent;
      if (!text) return;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(showToast).catch(() => fallbackCopy(text));
      } else {
        fallbackCopy(text);
      }
    }

    function showToast() {
      const toast = document.getElementById('toast');
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }



    function fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand('copy'); showToast(); } catch(e) {}
      document.body.removeChild(ta);
    }


    function clearAll() {
      document.getElementById('input').value = '';
      document.getElementById('outputBlocks').innerHTML = '<span class="empty-state" style="font-style:italic; color:var(--text3); font-size:13px;">Output will appear here...</span>';
      document.getElementById('reminder').style.display = 'none';
      document.getElementById('countBadge').textContent = '0 items';
    }

    initDate();
    buildSectionRows();
