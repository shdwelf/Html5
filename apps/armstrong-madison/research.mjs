/** Original source-review UI. All data stays in this document; user labels are rendered only as text. */
export function mountResearch(data, api) {
  const $ = (id) => document.getElementById(id);
  const element = (name, text, className) => {
    const node = document.createElement(name);
    if (text !== undefined) node.textContent = String(text);
    if (className) node.className = className;
    return node;
  };
  const { dossier, transcript, afioKey, claim, comparison, integrity, gutenbergExcerpt, notices } = data;
  const parsed = api.parseEdition(transcript);
  const baseline = api.makeReceipt(transcript, afioKey, claim, comparison);
  let key = api.validateKey(afioKey);
  let keyLabel = 'AFIO published claim';
  let dirty = false;
  const tabs = [...document.querySelectorAll('[role=tab]')];
  const views = new Set(tabs.map((tab) => tab.dataset.view));
  function selectView(view, focus = false) {
    if (!views.has(view)) return;
    for (const tab of tabs) {
      const selected = tab.dataset.view === view;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      $(`panel-${tab.dataset.view}`).hidden = !selected;
      if (selected && focus) tab.focus();
    }
  }
  for (const tab of tabs) {
    tab.addEventListener('click', () => selectView(tab.dataset.view));
    tab.addEventListener('keydown', (event) => {
      let index = tabs.indexOf(tab);
      if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') index = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = tabs.length - 1;
      else return;
      event.preventDefault();
      selectView(tabs[index].dataset.view, true);
    });
  }
  function citations(ids = []) {
    const list = element('div', undefined, 'citations');
    for (const id of ids) {
      const button = element('button', id);
      button.type = 'button';
      button.setAttribute('aria-label', `Read source ${id}`);
      button.addEventListener('click', () => {
        $('source-filter').value = '';
        $('source-kind').value = 'all';
        renderSources();
        selectView('sources');
        const target = $(`source-${id}`);
        target?.scrollIntoView({ block: 'start' });
        if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
      });
      list.append(button);
    }
    return list;
  }
  function stats(target, values) {
    target.replaceChildren(...values.map(([value, label]) => {
      const card = element('div');
      card.append(element('strong', value), element('span', label));
      return card;
    }));
  }
  $('identity').textContent = dossier.identity;
  stats($('baseline-stats'), [[baseline.strict.total, 'fully printed numeric readings'], [baseline.strict.damagedReadings, 'damaged numeric prefix'], [baseline.strict.distinct, 'distinct complete readings'], [`${baseline.strict.mapped}/${baseline.strict.total}`, 'covered by the claimed key · 35.6%']]);
  for (const finding of dossier.findings) {
    const article = element('article');
    article.id = `finding-${finding.id}`;
    article.append(element('span', finding.level, 'badge'), element('h3', finding.title), element('p', finding.text), citations(finding.sources));
    $('findings').append(article);
  }
  $('afio-claim').textContent = claim;
  $('key-editor').value = JSON.stringify(key, null, 2);
  function renderTranscript() {
    const highlight = $('highlight-code').value.trim();
    const labels = $('show-labels').checked && !dirty;
    const groups = new Map(parsed.lines.map((_, index) => [index + 1, []]));
    for (const token of parsed.tokens) groups.get(token.line).push(token);
    let highlighted = 0;
    const lines = [];
    for (const [number, tokens] of groups) {
      const line = element('div', undefined, 'transcript-line');
      const content = element('div', undefined, 'tokens');
      line.append(element('span', String(number).padStart(2, '0'), 'line-id'), content);
      for (const token of tokens) {
        if (token.kind === 'glyph') {
          content.append(element('span', token.wholeLines ? `[${token.spans} line${token.spans === 1 ? '' : 's'} of graphical symbols — not transcribed]` : '[graphical passage — not transcribed]', 'glyph'));
          continue;
        }
        const chosen = highlight !== '' && String(token.value) === highlight;
        if (chosen) highlighted++;
        const node = element('span', undefined, `code-token${token.complete ? '' : ' damaged'}${chosen ? ' chosen' : ''}`);
        node.dataset.code = token.value;
        node.append(element('b', token.printed));
        if (labels && Object.hasOwn(key, token.value)) node.append(element('span', `${token.complete ? '' : 'provisional: '}${key[token.value]}`, 'gloss'));
        if (!token.complete) node.title = 'Damaged numeric prefix; not a complete established group';
        content.append(node);
      }
      lines.push(line);
    }
    $('transcript-lines').replaceChildren(...lines);
    $('highlight-status').textContent = highlight ? `${highlighted} visible occurrence${highlighted === 1 ? '' : 's'} of ${highlight}, including any damaged prefix.` : 'The clear opening and closing are retained; graphical descriptions remain explicit gaps.';
  }
  function renderFrequency() {
    const result = api.audit(parsed.tokens, key, $('include-damaged').checked);
    const filter = $('frequency-filter').value.trim().toLowerCase();
    const rows = result.frequency.filter((item) => `${item.code} ${item.label || ''}`.toLowerCase().includes(filter)).map((item) => {
      const row = element('tr');
      row.append(element('td', item.code), element('td', item.count), element('td', item.label || 'Unmapped', item.label ? '' : 'unmapped'));
      return row;
    });
    $('frequency-body').replaceChildren(...rows);
  }
  function renderAudit() {
    const damaged = $('include-damaged').checked;
    const result = api.audit(parsed.tokens, key, damaged);
    const alignment = api.subsequenceAudit(parsed.tokens, key, claim, damaged);
    stats($('audit-stats'), [[`${result.mapped}/${result.total}`, 'numeric readings covered'], [`${result.coveragePercent.toFixed(1)}%`, 'coverage, not correctness'], [`${result.mappedDistinct}/${result.distinct}`, 'distinct readings labeled'], [result.absentKeyCodes.length, 'key codes absent from the text']]);
    $('absent-codes').textContent = result.absentKeyCodes.length ? `Absent key codes: ${result.absentKeyCodes.join(', ')}. No automatic correction of 431 to 432 or 1350 to 1358 is made.` : 'Every supplied key code occurs in this numeric reading (or the key is empty).';
    $('alignment-score').textContent = `Permissive in-order comparison with AFIO's paragraph: ${alignment.matchedInOrder} of ${alignment.claimWords} words can match; ${alignment.mappedOccurrencesNotUsedByBestSubsequence} mapped numeric occurrences remain unused even by that omission-allowing score. Graphics are still unaccounted for.`;
    $('key-status').className = '';
    $('key-status').textContent = `${keyLabel} · ${result.keyEntries} labels applied in memory. No message sent, no guesses saved.`;
    $('audit-results').hidden = false;
    renderFrequency();
    renderTranscript();
  }
  function invalidate() {
    dirty = true;
    $('audit-results').hidden = true;
    $('frequency-body').replaceChildren();
    $('key-status').className = '';
    $('key-status').textContent = 'Edited, not applied. Previous audit and label overlays are hidden until validation succeeds.';
    renderTranscript();
  }
  $('key-editor').addEventListener('input', invalidate);
  $('apply-key').addEventListener('click', () => {
    try {
      key = api.parseKey($('key-editor').value);
      keyLabel = 'User hypothesis';
      dirty = false;
      renderAudit();
    } catch (error) {
      invalidate();
      $('key-status').className = 'error';
      $('key-status').textContent = `Not applied: ${error.message}`;
    }
  });
  $('reset-key').addEventListener('click', () => {
    key = api.validateKey(afioKey);
    keyLabel = 'AFIO published claim';
    dirty = false;
    $('key-editor').value = JSON.stringify(key, null, 2);
    renderAudit();
  });
  $('empty-key').addEventListener('click', () => {
    key = api.validateKey({}); keyLabel = 'Empty key'; dirty = false;
    $('key-editor').value = '{}'; renderAudit();
  });
  $('include-damaged').addEventListener('change', () => { if (!dirty) renderAudit(); });
  $('show-labels').addEventListener('change', renderTranscript);
  $('highlight-code').addEventListener('input', renderTranscript);
  $('frequency-filter').addEventListener('input', () => { if (!dirty) renderFrequency(); });
  function primary(source) { return /Primary|Official|Archive catalog|Editorial image/u.test(source.kind); }
  function discovery(source) { return /Metasearch|directory|Service directory|Archive search/iu.test(source.kind); }
  function renderSources() {
    const query = $('source-filter').value.trim().toLowerCase();
    const family = $('source-kind').value;
    const sources = dossier.sources.filter((source) => {
      const textMatch = `${source.id} ${source.kind} ${source.title} ${source.status} ${source.note} ${source.url}`.toLowerCase().includes(query);
      const familyMatch = family === 'all' || (family === 'primary' && primary(source)) || (family === 'discovery' && discovery(source)) || (family === 'secondary' && !primary(source) && !discovery(source)) || (family === 'limits' && /failed|not acquired|metadata|discovery|unfetched/iu.test(source.status + ' ' + source.kind));
      return textMatch && familyMatch;
    });
    $('source-count').textContent = `${sources.length} of ${dossier.sources.length} source records. This is a register, not a count of independent witnesses.`;
    $('source-cards').replaceChildren(...sources.map((source) => {
      const article = element('article'); article.id = `source-${source.id}`;
      article.append(element('span', source.id, 'source-id'), element('h3', source.title), element('p', `${source.kind} · ${source.status}`, 'source-status'), element('p', source.note));
      if (source.url) {
        const url = new URL(source.url);
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Non-HTTPS source URL rejected.');
        const link = element('a', source.url, 'source-url');
        link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer';
        article.append(link);
      }
      return article;
    }));
  }
  $('source-filter').addEventListener('input', renderSources);
  $('source-kind').addEventListener('change', renderSources);
  for (const query of dossier.queries) {
    const article = element('article');
    article.append(element('h3', query.service), element('p', query.query, 'query'), element('p', query.result), citations(query.sources));
    $('query-trail').append(article);
  }
  for (const step of dossier.nextSteps) {
    const article = element('article'); article.append(element('h3', step.title), element('p', step.text)); $('next-steps').append(article);
  }
  for (const letter of dossier.letters) {
    const article = element('article'); article.append(element('h3', letter.title), element('blockquote', letter.text), citations([letter.source])); $('letter-excerpts').append(article);
  }
  $('gutenberg-excerpt').textContent = gutenbergExcerpt;
  $('third-party-notices').textContent = notices;
  $('integrity-list').textContent = integrity.map((file) => `${file.path}\n${file.bytes} bytes · SHA-256 ${file.sha256}\n`).join('\n');
  $('method').textContent = dossier.method;
  function currentReceipt() {
    return JSON.stringify({ ...baseline, evidenceIntegrity: integrity, sourceRegister: dossier.sources, activeHypothesis: dirty ? { status: 'Unapplied editor content excluded' } : { status: keyLabel, key, includeDamaged: $('include-damaged').checked, audit: api.audit(parsed.tokens, key, $('include-damaged').checked) } }, null, 2) + '\n';
  }
  $('show-receipt').addEventListener('click', () => {
    $('receipt-output').hidden = false;
    $('receipt-output').value = currentReceipt();
    $('receipt-output').focus();
    $('export-status').textContent = 'Recomputed locally. Select or copy the text; nothing has been uploaded.';
  });
  $('download-receipt').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([currentReceipt()], { type: 'application/json' }));
    const link = element('a'); link.href = url; link.download = 'armstrong-madison-audit.json';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    $('export-status').textContent = 'Download requested, not confirmed saved. Some offline hosts block downloads; use Show JSON if needed.';
  });
  renderSources(); renderAudit();
  document.body.dataset.researchReady = 'true';
}
