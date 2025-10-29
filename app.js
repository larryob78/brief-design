const STORAGE_PREFIX = 'brief-intake::';
const loginForm = document.getElementById('loginForm');
const loginView = document.getElementById('loginView');
const workspaceView = document.getElementById('workspaceView');
const workspaceInfo = document.getElementById('workspaceInfo');
const workspaceTitle = document.getElementById('workspaceTitle');
const workspaceSubtitle = document.getElementById('workspaceSubtitle');
const progressBar = document.getElementById('progressBar');
const progressLabel = document.getElementById('progressLabel');
const autosaveStatus = document.getElementById('autosaveStatus');
const stepsContainer = document.getElementById('steps');
const formEl = document.getElementById('briefForm');
const previewEl = document.getElementById('briefPreview');
const shareModal = document.getElementById('shareModal');
const shareLinkInput = document.getElementById('shareLink');

let currentAccount = null;
let formState = {};
let fileState = {};
let autosaveTimer = null;

const sections = [
  {
    id: 'project',
    title: 'Project Details',
    subtitle: 'Frame the assignment and stakeholders',
    fields: [
      { id: 'projectName', label: 'Project Name', type: 'text', placeholder: 'Launch campaign for new product line' },
      { id: 'brand', label: 'Brand / Business Unit', type: 'text', placeholder: 'Brand or BU name' },
      { id: 'projectLead', label: 'Primary Contact & Role', type: 'text', placeholder: 'Jane Smith, Global Brand Director' },
      { id: 'approvers', label: 'Approvers & Final Decision Makers', type: 'textarea', placeholder: 'List key approvers and their roles' },
      { id: 'projectAssets', label: 'Supporting Assets', type: 'file', help: 'Upload brand guidelines, existing creative, or reference decks.' }
    ]
  },
  {
    id: 'background',
    title: 'Brand Background',
    subtitle: 'Ground the team in context',
    fields: [
      { id: 'brandBackground', label: 'Brand & Market Context', type: 'textarea', placeholder: 'Where the brand is today, competitive landscape, prior campaigns' },
      { id: 'problem', label: 'Problem / Opportunity Statement', type: 'textarea', placeholder: 'What business challenge are we solving? Why now?' },
      { id: 'objectives', label: 'Objectives & KPIs', type: 'textarea', placeholder: 'SMART objectives and the metrics that will define success' },
      { id: 'budget', label: 'Budget Guidance', type: 'text', placeholder: 'Total budget or investment range' },
      { id: 'backgroundFiles', label: 'Reference Material', type: 'file', help: 'Upload research, analytics, or past performance reports.' }
    ]
  },
  {
    id: 'audience',
    title: 'Audience & Insight',
    subtitle: 'Define who we are talking to and why it matters',
    fields: [
      { id: 'audience', label: 'Primary Audience', type: 'textarea', placeholder: 'Demographics, psychographics, need states, behaviors' },
      {
        id: 'insight',
        label: 'Human Insight',
        type: 'textarea',
        placeholder: 'What is the fresh, motivating human truth we are tapping into?',
        help: '<strong>Insight tip:</strong> Capture a tension or unmet need expressed in human language. For example, “New parents feel overwhelmed by conflicting advice and crave a trusted guide.”'
      },
      {
        id: 'smp',
        label: 'Single-Minded Proposition',
        type: 'textarea',
        placeholder: 'If the audience remembers one thing, it should be…',
        help: '<strong>SMP best practice:</strong> Make it sharp and declarative. For example, “Brand X is the calm, expert guide that lets new parents feel confident in every decision.”'
      },
      { id: 'audienceFiles', label: 'Audience Artifacts', type: 'file', help: 'Personas, journeys, quotes, or qualitative research.' }
    ]
  },
  {
    id: 'deliverables',
    title: 'Deliverables & Execution',
    subtitle: 'Clarify what needs to be produced',
    fields: [
      { id: 'deliverables', label: 'Deliverables', type: 'textarea', placeholder: 'List formats, channels, and required specs' },
      { id: 'timeline', label: 'Timeline & Key Dates', type: 'textarea', placeholder: 'Milestones, launch dates, production windows' },
      { id: 'mandatory', label: 'Mandatory Elements', type: 'textarea', placeholder: 'Logos, taglines, legal copy, brand assets' },
      { id: 'tone', label: 'Tone & Style', type: 'textarea', placeholder: 'Voice, look & feel, cultural cues' },
      { id: 'deliverableFiles', label: 'Uploads', type: 'file', help: 'Logos, design systems, timelines, or production templates.' }
    ]
  },
  {
    id: 'workflow',
    title: 'Approval Workflow',
    subtitle: 'Plan collaboration and governance',
    fields: [
      { id: 'stakeholders', label: 'Stakeholder Workflow', type: 'textarea', placeholder: 'Who needs to review? What are the feedback loops?' },
      { id: 'risks', label: 'Risks & Dependencies', type: 'textarea', placeholder: 'Highlight approvals, compliance, or production considerations' },
      { id: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Anything else the team needs to know' },
      { id: 'workflowFiles', label: 'Workflow Assets', type: 'file', help: 'Org charts, approval matrices, or governance docs.' }
    ]
  }
];

function computeStorageKey(account) {
  return `${STORAGE_PREFIX}${account.workspace}|${account.email}`;
}

function getStoredAccount() {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}session`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse stored session', error);
    return null;
  }
}

function persistSession(account) {
  localStorage.setItem(`${STORAGE_PREFIX}session`, JSON.stringify(account));
}

function clearSession() {
  localStorage.removeItem(`${STORAGE_PREFIX}session`);
}

function loadFormState(account) {
  const raw = localStorage.getItem(computeStorageKey(account));
  if (!raw) return { form: {}, files: {} };
  try {
    const parsed = JSON.parse(raw);
    return { form: parsed.form ?? {}, files: parsed.files ?? {} };
  } catch (error) {
    console.warn('Failed to parse form state', error);
    return { form: {}, files: {} };
  }
}

function scheduleAutosave() {
  autosaveStatus.textContent = 'Saving…';
  autosaveStatus.classList.remove('autosaved');
  if (autosaveTimer) window.clearTimeout(autosaveTimer);
  autosaveTimer = window.setTimeout(() => {
    saveState();
    autosaveStatus.textContent = 'Autosaved';
    autosaveStatus.classList.add('autosaved');
  }, 400);
}

function saveState() {
  if (!currentAccount) return;
  const payload = { form: formState, files: fileState };
  localStorage.setItem(computeStorageKey(currentAccount), JSON.stringify(payload));
}

function signOut() {
  clearSession();
  currentAccount = null;
  formState = {};
  fileState = {};
  loginView.hidden = false;
  workspaceInfo.hidden = true;
  workspaceView.hidden = true;
}

document.getElementById('signOut').addEventListener('click', (event) => {
  event.preventDefault();
  signOut();
});

function hydrateForm() {
  formEl.innerHTML = '';
  sections.forEach((section) => {
    const wrapper = document.createElement('section');
    wrapper.className = 'field-group';
    wrapper.dataset.section = section.id;

    const header = document.createElement('header');
    const title = document.createElement('h3');
    title.textContent = section.title;
    const subtitle = document.createElement('p');
    subtitle.className = 'help';
    subtitle.textContent = section.subtitle;
    header.appendChild(title);
    header.appendChild(subtitle);
    wrapper.appendChild(header);

    section.fields.forEach((field) => {
      const label = document.createElement('label');
      label.htmlFor = field.id;
      label.textContent = field.label;

      let input;
      if (field.type === 'textarea') {
        input = document.createElement('textarea');
      } else if (field.type === 'file') {
        input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '*/*';
      } else {
        input = document.createElement('input');
        input.type = field.type;
      }
      input.id = field.id;
      input.name = field.id;
      input.placeholder = field.placeholder ?? '';

      if (field.type !== 'file') {
        input.value = formState[field.id] ?? '';
        input.addEventListener('input', () => {
          formState[field.id] = input.value;
          scheduleAutosave();
          renderPreview();
          updateProgress();
          refreshSteps();
        });
      } else {
        input.addEventListener('change', async () => {
          const files = Array.from(input.files ?? []);
          fileState[field.id] = await Promise.all(files.map(processFile));
          scheduleAutosave();
          renderPreview();
          renderUploads(wrapper, field);
        });
        renderUploads(wrapper, field);
      }

      label.appendChild(input);

      if (field.help) {
        const help = document.createElement('p');
        help.className = 'help';
        help.innerHTML = field.help;
        label.appendChild(help);
      }

      wrapper.appendChild(label);
    });

    formEl.appendChild(wrapper);
  });
}

function renderUploads(sectionEl, field) {
  let uploadsEl = sectionEl.querySelector(`[data-uploads="${field.id}"]`);
  if (!uploadsEl) {
    uploadsEl = document.createElement('div');
    uploadsEl.className = 'uploads';
    uploadsEl.dataset.uploads = field.id;
    const title = document.createElement('p');
    title.className = 'muted';
    title.textContent = 'Uploaded files';
    uploadsEl.appendChild(title);
    const list = document.createElement('ul');
    uploadsEl.appendChild(list);
    sectionEl.appendChild(uploadsEl);
  }
  const list = uploadsEl.querySelector('ul');
  list.innerHTML = '';
  const files = fileState[field.id] ?? [];
  if (!files.length) {
    const empty = document.createElement('li');
    empty.className = 'muted';
    empty.textContent = 'No files uploaded yet.';
    list.appendChild(empty);
    return;
  }
  files.forEach((file) => {
    const item = document.createElement('li');
    item.className = 'upload-pill';
    item.textContent = `${file.name} (${formatBytes(file.size)})`;
    list.appendChild(item);
  });
}

async function processFile(file) {
  const encoded = await fileToBase64(file);
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    data: encoded
  };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderSteps(currentSection = sections[0].id) {
  stepsContainer.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'step-list';
  sections.forEach((section) => {
    const item = document.createElement('div');
    item.className = 'step';
    if (section.id === currentSection) item.classList.add('current');
    if (isSectionComplete(section)) item.classList.add('complete');
    const title = document.createElement('strong');
    title.textContent = section.title;
    const subtitle = document.createElement('span');
    subtitle.className = 'muted';
    subtitle.textContent = section.subtitle;
    item.appendChild(title);
    item.appendChild(subtitle);
    grid.appendChild(item);
  });
  stepsContainer.appendChild(grid);
}

function refreshSteps() {
  const current = document.querySelector('.field-group:target')?.dataset.section ?? sections[0].id;
  renderSteps(current);
}

function renderPreview() {
  previewEl.innerHTML = '';
  sections.forEach((section) => {
    const sectionEl = document.createElement('section');
    sectionEl.className = 'preview-section';
    const title = document.createElement('h4');
    title.textContent = section.title;
    sectionEl.appendChild(title);

    section.fields.forEach((field) => {
      if (field.type === 'file') {
        const files = fileState[field.id] ?? [];
        if (!files.length) return;
        const label = document.createElement('h5');
        label.textContent = `${field.label} (${files.length})`;
        label.className = 'muted';
        sectionEl.appendChild(label);
        const list = document.createElement('ul');
        list.className = 'muted';
        files.forEach((file) => {
          const item = document.createElement('li');
          const link = document.createElement('a');
          link.href = file.data;
          link.download = file.name;
          link.textContent = `${file.name} (${formatBytes(file.size)})`;
          item.appendChild(link);
          list.appendChild(item);
        });
        sectionEl.appendChild(list);
      } else {
        const value = formState[field.id];
        if (!value) return;
        const label = document.createElement('h5');
        label.textContent = field.label;
        label.className = 'muted';
        const paragraph = document.createElement('p');
        paragraph.textContent = value;
        sectionEl.appendChild(label);
        sectionEl.appendChild(paragraph);
      }
    });

    previewEl.appendChild(sectionEl);
  });
}

function isSectionComplete(section) {
  const textFields = section.fields.filter((field) => field.type !== 'file');
  if (!textFields.length) return false;
  return textFields.every((field) => {
    const value = formState[field.id];
    return value && value.trim().length > 0;
  });
}

function updateProgress() {
  const totalFields = sections.reduce((acc, section) => acc + section.fields.filter((f) => f.type !== 'file').length, 0);
  const completed = sections.reduce((acc, section) => {
    return (
      acc +
      section.fields.filter((field) => field.type !== 'file').filter((field) => {
        const value = formState[field.id];
        return value && value.trim().length > 0;
      }).length
    );
  }, 0);
  const percent = Math.round((completed / totalFields) * 100) || 0;
  progressBar.style.width = `${percent}%`;
  progressLabel.textContent = `${percent}% complete`;
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function handleExport(type) {
  if (type === 'print') {
    window.print();
    return;
  }

  if (type === 'doc') {
    const html = generateDocumentHTML();
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    downloadBlob(blob, `${formState.projectName || 'creative-brief'}.doc`);
    return;
  }

  if (type === 'notion') {
    const markdown = generateMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    downloadBlob(blob, `${formState.projectName || 'creative-brief'}.md`);
    return;
  }

  if (type === 'share') {
    openShareModal();
  }
}

function generateDocumentHTML() {
  const lines = [];
  lines.push('<html><head><meta charset="utf-8"><style>body{font-family:Inter,Arial,sans-serif;padding:40px;line-height:1.5;color:#111}h2{margin-top:32px;}h1{font-size:24px;}ul{padding-left:18px;}li{margin-bottom:6px;}</style></head><body>');
  lines.push(`<h1>${escapeHtml(formState.projectName || 'Creative Brief')}</h1>`);
  sections.forEach((section) => {
    lines.push(`<h2>${escapeHtml(section.title)}</h2>`);
    section.fields.forEach((field) => {
      if (field.type === 'file') {
        const files = fileState[field.id] ?? [];
        if (!files.length) return;
        lines.push(`<h3>${escapeHtml(field.label)}</h3>`);
        lines.push('<ul>');
        files.forEach((file) => {
          lines.push(`<li>${escapeHtml(file.name)} (${formatBytes(file.size)})</li>`);
        });
        lines.push('</ul>');
      } else {
        const value = formState[field.id];
        if (!value) return;
        lines.push(`<h3>${escapeHtml(field.label)}</h3>`);
        lines.push(`<p>${escapeHtml(value).replace(/\n/g, '<br>')}</p>`);
      }
    });
  });
  lines.push('</body></html>');
  return lines.join('\n');
}

function generateMarkdown() {
  const lines = [];
  lines.push(`# ${formState.projectName || 'Creative Brief'}`);
  sections.forEach((section) => {
    lines.push(`\n## ${section.title}`);
    section.fields.forEach((field) => {
      if (field.type === 'file') {
        const files = fileState[field.id] ?? [];
        if (!files.length) return;
        lines.push(`\n**${field.label}:**`);
        files.forEach((file) => {
          lines.push(`- ${file.name} (${formatBytes(file.size)})`);
        });
      } else {
        const value = formState[field.id];
        if (!value) return;
        lines.push(`\n**${field.label}**\n`);
        lines.push(`${value}`);
      }
    });
  });
  return lines.join('\n');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function openShareModal() {
  const shareCode = generateShareCode();
  const link = `${window.location.origin}${window.location.pathname}#share-${shareCode}`;
  shareLinkInput.value = link;
  shareModal.hidden = false;
}

function closeShareModal() {
  shareModal.hidden = true;
}

function generateShareCode() {
  const base = `${currentAccount.workspace}-${currentAccount.email}-${Date.now()}`;
  return btoa(base).replace(/[^a-z0-9]/gi, '').slice(0, 10);
}

document.getElementById('closeShare').addEventListener('click', () => closeShareModal());
document.getElementById('copyShare').addEventListener('click', () => {
  shareLinkInput.select();
  document.execCommand('copy');
});

shareModal.addEventListener('click', (event) => {
  if (event.target === shareModal) closeShareModal();
});

function bootstrapAccount(account) {
  currentAccount = account;
  persistSession(account);
  const stored = loadFormState(account);
  formState = stored.form;
  fileState = stored.files;
  loginView.hidden = true;
  workspaceInfo.hidden = false;
  workspaceView.hidden = false;
  workspaceTitle.textContent = account.workspaceLabel;
  workspaceSubtitle.textContent = `${account.email} • Workspace ${account.workspace}`;
  hydrateForm();
  renderSteps();
  renderPreview();
  updateProgress();
  autosaveStatus.textContent = 'Autosaved';
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const workspace = document.getElementById('loginWorkspace').value.trim();
  if (!email || !workspace) return;
  const account = {
    email,
    workspace,
    workspaceLabel: `Workspace ${workspace.toUpperCase()}`
  };
  bootstrapAccount(account);
});

const storedAccount = getStoredAccount();
if (storedAccount) {
  bootstrapAccount(storedAccount);
}

Array.from(document.querySelectorAll('.export-panel button')).forEach((button) => {
  button.addEventListener('click', (event) => {
    const type = event.currentTarget.dataset.export;
    handleExport(type);
  });
});

window.addEventListener('beforeunload', () => {
  saveState();
});

refreshSteps();
renderPreview();
updateProgress();
