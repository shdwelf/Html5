(function () {
  const STYLE_KEY = 'greeran-book-style-v1';
  const VAULT_KEY = 'greeran-book-vault-v1';

  const palettes = [
    {
      id: 'desert-brass',
      name: 'Desert brass',
      sceneA: '#3c342b',
      sceneB: '#191612',
      paper: '#f6eedf',
      paper2: '#eadbbd',
      ink: '#1d1812',
      inkSoft: '#5f5343',
      accent: '#9a6a12',
      accent2: '#70490d'
    },
    {
      id: 'spruce-ledger',
      name: 'Spruce ledger',
      sceneA: '#20352f',
      sceneB: '#111b18',
      paper: '#edf2e7',
      paper2: '#d6e4d2',
      ink: '#16201c',
      inkSoft: '#4d6158',
      accent: '#3f7d60',
      accent2: '#2f5e47'
    },
    {
      id: 'oxford-file',
      name: 'Oxford file',
      sceneA: '#1f2e49',
      sceneB: '#101723',
      paper: '#eef2f8',
      paper2: '#dbe4f2',
      ink: '#141a23',
      inkSoft: '#4d596d',
      accent: '#496fa9',
      accent2: '#294e80'
    },
    {
      id: 'plum-archive',
      name: 'Plum archive',
      sceneA: '#3c2439',
      sceneB: '#1d111a',
      paper: '#f5ecf4',
      paper2: '#ead7e6',
      ink: '#231520',
      inkSoft: '#624e5d',
      accent: '#9a4e82',
      accent2: '#773763'
    },
    {
      id: 'basalt-court',
      name: 'Basalt court',
      sceneA: '#2b3135',
      sceneB: '#131618',
      paper: '#f1f1ef',
      paper2: '#dfdfdb',
      ink: '#181a1c',
      inkSoft: '#53585c',
      accent: '#7a5f4a',
      accent2: '#57412f'
    }
  ];

  const papers = [
    { id: 'field-notebook', name: 'Field notebook' },
    { id: 'ambassador-ledger', name: 'Ambassador ledger' },
    { id: 'cotton-rag', name: 'Cotton rag' },
    { id: 'dot-grid', name: 'Dot grid' },
    { id: 'onion-skin', name: 'Onion skin' },
    { id: 'blueprint-sheet', name: 'Blueprint sheet' },
    { id: 'archive-card', name: 'Archive card' },
    { id: 'legal-pad', name: 'Legal pad' },
    { id: 'marbled-endpaper', name: 'Marbled endpaper' },
    { id: 'postcard-stock', name: 'Postcard stock' }
  ];

  const themeNumber = document.getElementById('themeNumber');
  const paletteName = document.getElementById('paletteName');
  const paperName = document.getElementById('paperName');
  const paperSelect = document.getElementById('paperSelect');
  const rollStyle = document.getElementById('rollStyle');
  const storeStyle = document.getElementById('storeStyle');
  const progress = document.getElementById('progress');

  const fileList = document.getElementById('fileList');
  const filePathInput = document.getElementById('filePathInput');
  const fileEditor = document.getElementById('fileEditor');
  const vaultStatus = document.getElementById('vaultStatus');
  const newFileBtn = document.getElementById('newFileBtn');
  const saveFileBtn = document.getElementById('saveFileBtn');
  const deleteFileBtn = document.getElementById('deleteFileBtn');
  const snapshotBtn = document.getElementById('snapshotBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importInput = document.getElementById('importInput');

  let styleState = loadStyleState();
  let vault = loadVault();
  let currentFile = Object.keys(vault.files).sort()[0];

  function loadStyleState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STYLE_KEY) || '{}');
      if (typeof parsed.paletteIndex === 'number' && typeof parsed.paperIndex === 'number') {
        return parsed;
      }
    } catch (err) {}
    return { paletteIndex: 0, paperIndex: 0 };
  }

  function saveStyleState() {
    localStorage.setItem(STYLE_KEY, JSON.stringify(styleState));
  }

  function applyTheme() {
    const palette = palettes[styleState.paletteIndex % palettes.length];
    const paper = papers[styleState.paperIndex % papers.length];
    const root = document.documentElement.style;
    root.setProperty('--scene-a', palette.sceneA);
    root.setProperty('--scene-b', palette.sceneB);
    root.setProperty('--paper', palette.paper);
    root.setProperty('--paper-2', palette.paper2);
    root.setProperty('--ink', palette.ink);
    root.setProperty('--ink-soft', palette.inkSoft);
    root.setProperty('--accent', palette.accent);
    root.setProperty('--accent-2', palette.accent2);
    document.body.dataset.paper = paper.id;
    themeNumber.textContent = String(styleState.paletteIndex * papers.length + styleState.paperIndex + 1).padStart(2, '0') + ' / 50';
    paletteName.textContent = palette.name;
    paperName.textContent = paper.name;
    paperSelect.value = paper.id;
    saveStyleState();
  }

  function randomizeStyle() {
    styleState.paletteIndex = Math.floor(Math.random() * palettes.length);
    styleState.paperIndex = Math.floor(Math.random() * papers.length);
    applyTheme();
    setVaultStatus('Random style rolled and stored in browser settings.');
  }

  papers.forEach((paper, index) => {
    const option = document.createElement('option');
    option.value = paper.id;
    option.textContent = paper.name;
    option.dataset.index = String(index);
    paperSelect.appendChild(option);
  });

  paperSelect.addEventListener('change', function () {
    styleState.paperIndex = papers.findIndex((paper) => paper.id === paperSelect.value);
    if (styleState.paperIndex < 0) styleState.paperIndex = 0;
    applyTheme();
    setVaultStatus('Paper texture changed.');
  });

  rollStyle.addEventListener('click', randomizeStyle);
  storeStyle.addEventListener('click', function () {
    const styleFile = {
      saved_at: new Date().toISOString(),
      theme_number: styleState.paletteIndex * papers.length + styleState.paperIndex + 1,
      palette: palettes[styleState.paletteIndex].name,
      paper: papers[styleState.paperIndex].name,
      palette_index: styleState.paletteIndex,
      paper_index: styleState.paperIndex
    };
    vault.files['/settings/style.json'] = JSON.stringify(styleFile, null, 2);
    saveVault();
    renderFiles();
    openFile('/settings/style.json');
    setVaultStatus('Current style stored at /settings/style.json');
  });

  function defaultVault() {
    return {
      version: 1,
      files: {
        '/chapters/00-premise.md': [
          '# Premise',
          '',
          'This book model is built from two source classes:',
          '- official 2025 USVI public records',
          '- a self-published Steven Greeran web resume',
          '',
          'Keep the legal chronology factual and keep self-published material clearly labeled.'
        ].join('\n'),
        '/chapters/01-southern-california-trail.md': [
          '# Southern California trail',
          '',
          'Verified from the self-published resume:',
          '- Glendora High School (1997-2001)',
          '- Citrus Community College (2001 summer school)',
          '- California State Polytechnic Institute Pomona (1998 summer school)',
          '- Duarte, San Dimas, Pomona references in projects/volunteer listings',
          '',
          'Only move extra place anecdotes into the public book after verification.'
        ].join('\n'),
        '/chapters/02-ucsb-santa-barbara.md': [
          '# UCSB and Santa Barbara years',
          '',
          'Resume-backed items:',
          '- UCSB CMPSCI / College of Engineering (2001-2004)',
          '- Davidson Library / Alexandria Digital Library student programming',
          '- Wax-cylinder project listing',
          '- Santa Barbara Food Bank / Botanic Garden / Goleta fair references'
        ].join('\n'),
        '/chapters/03-public-record.md': [
          '# Official public record',
          '',
          '- California conviction referenced by VIDOJ',
          '- Initial USVI registration: 2022-10-28',
          '- Most recent published update: 2023-10-27',
          '- Missed annual update: 2024-10-28',
          '- Wanted notice: 2025-02-21',
          '- Arrest: 2025-02-23',
          '- Arraignment / charge / bail: 2025-02-24',
          '',
          'Pending charge is not a conviction.'
        ].join('\n'),
        '/notes/source-ledger.txt': [
          'Sources presently in use:',
          '1-8 = official/public reporting on USVI registration case',
          '9 = self-published Standard Resume page',
          '',
          'If new documentation arrives, log it here before revising the public book.'
        ].join('\n'),
        '/notes/private-prompts.txt': [
          'Private prompts area.',
          '',
          'Use this file for memories, locations, social connections, apartment notes, class schedule fragments, or travel recollections that are not yet verified.',
          'Do not promote them into the published book until sourced or intentionally labeled personal recollection.'
        ].join('\n'),
        '/settings/style.json': JSON.stringify({
          note: 'Use the Store style button to overwrite this file with the current theme.'
        }, null, 2)
      }
    };
  }

  function loadVault() {
    try {
      const parsed = JSON.parse(localStorage.getItem(VAULT_KEY) || '{}');
      if (parsed && parsed.files && typeof parsed.files === 'object') {
        return parsed;
      }
    } catch (err) {}
    const fresh = defaultVault();
    localStorage.setItem(VAULT_KEY, JSON.stringify(fresh));
    return fresh;
  }

  function saveVault() {
    localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
  }

  function setVaultStatus(message) {
    vaultStatus.textContent = message;
  }

  function renderFiles() {
    const paths = Object.keys(vault.files).sort();
    fileList.innerHTML = '';
    paths.forEach((path) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = path;
      button.className = path === currentFile ? 'active' : '';
      button.addEventListener('click', function () {
        openFile(path);
      });
      li.appendChild(button);
      fileList.appendChild(li);
    });
  }

  function openFile(path) {
    currentFile = path;
    filePathInput.value = path;
    fileEditor.value = vault.files[path] || '';
    renderFiles();
  }

  function commitCurrentFile() {
    const nextPath = (filePathInput.value || '').trim();
    if (!nextPath.startsWith('/')) {
      setVaultStatus('Paths must begin with /.');
      return false;
    }

    if (nextPath !== currentFile) {
      delete vault.files[currentFile];
      currentFile = nextPath;
    }

    vault.files[currentFile] = fileEditor.value;
    saveVault();
    renderFiles();
    setVaultStatus('Saved ' + currentFile);
    return true;
  }

  newFileBtn.addEventListener('click', function () {
    const raw = window.prompt('New file path', '/notes/new-note.txt');
    if (!raw) return;
    const path = raw.trim();
    if (!path.startsWith('/')) {
      setVaultStatus('New files must begin with /.');
      return;
    }
    if (!vault.files[path]) {
      vault.files[path] = '';
      saveVault();
    }
    openFile(path);
    setVaultStatus('Opened ' + path);
  });

  saveFileBtn.addEventListener('click', commitCurrentFile);

  deleteFileBtn.addEventListener('click', function () {
    if (!currentFile) return;
    const paths = Object.keys(vault.files);
    if (paths.length === 1) {
      setVaultStatus('Vault must keep at least one file.');
      return;
    }
    if (!window.confirm('Delete ' + currentFile + '?')) return;
    delete vault.files[currentFile];
    currentFile = Object.keys(vault.files).sort()[0];
    saveVault();
    openFile(currentFile);
    setVaultStatus('File deleted.');
  });

  snapshotBtn.addEventListener('click', function () {
    const activeSection = Array.from(document.querySelectorAll('.page'))
      .reverse()
      .find((section) => window.scrollY + 180 >= section.offsetTop) || document.querySelector('.page');

    const title = activeSection ? activeSection.querySelector('h2')?.textContent || activeSection.id : 'snapshot';
    const slug = (activeSection?.id || 'snapshot').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const path = '/snapshots/' + stamp + '-' + slug + '.txt';
    const body = [
      'SNAPSHOT: ' + title,
      'Saved: ' + new Date().toString(),
      '',
      activeSection ? activeSection.innerText.trim() : ''
    ].join('\n');
    vault.files[path] = body;
    saveVault();
    openFile(path);
    setVaultStatus('Chapter snapshot saved to ' + path);
  });

  exportBtn.addEventListener('click', function () {
    const blob = new Blob([JSON.stringify(vault, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'greeran-book-vault.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setVaultStatus('Vault exported as greeran-book-vault.json');
  });

  importInput.addEventListener('change', function () {
    const file = importInput.files && importInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (!parsed.files || typeof parsed.files !== 'object') throw new Error('bad vault');
        vault = parsed;
        saveVault();
        currentFile = Object.keys(vault.files).sort()[0];
        openFile(currentFile);
        setVaultStatus('Vault imported successfully.');
      } catch (err) {
        setVaultStatus('Import failed: JSON did not match vault format.');
      }
    };
    reader.readAsText(file);
    importInput.value = '';
  });

  filePathInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitCurrentFile();
    }
  });

  document.addEventListener('scroll', function () {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    progress.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
  }, { passive: true });

  applyTheme();
  renderFiles();
  openFile(currentFile);
})();
