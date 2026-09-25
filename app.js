(() => {
  const D = window.LA_PASION_DATA;
  if (!D) return;

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
  const num = (x, d = 0) => Number(x).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });

  const riskBand = (score) => score >= .9 ? ['Priority review', 'attn'] : score >= .7 ? ['Elevated', 'attn'] : score >= .4 ? ['Watch', ''] : ['Lower relative risk', ''];

  function initMenu() {
    const btn = $('.menu-button');
    const menu = $('.mobile-menu');
    btn?.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      menu.hidden = open;
    });
    $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => {
      menu.hidden = true;
      btn?.setAttribute('aria-expanded', 'false');
    }));
  }

  function initScrollProgress() {
    const bar = $('#scroll-progress');
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
    };
    addEventListener('scroll', update, { passive: true });
    update();
  }

  function initTeam() {
    const root = $('#team-list');
    root.innerHTML = D.team.members.map(m => `
      <div class="team-member">
        <strong>${m.name}</strong>
        <span>${m.role}</span>
        <a href="mailto:${m.email}">${m.email}</a>
      </div>`).join('');
  }

  function renderSignal(s) {
    const score = s.ehtimollik;
    const [band, cls] = riskBand(score);
    $('#risk-number').textContent = `${(score * 100).toFixed(1)}`;
    $('#risk-band').textContent = band;
    $('#risk-band').className = `risk-band ${cls}`;
    $('#risk-fill').style.width = `${score * 100}%`;
    $('#signal-date').textContent = `${s.signal_id} · anonymized example`;

    const kpis = [
      ['180d transactions', num(s.pre_count), `test median ${num(D.medians.pre_count)}`],
      ['24h transactions', num(s.pre_1d_count), `test median ${num(D.medians.pre_1d_count)}`],
      ['Incoming share', pct(s.incoming_share_pre), `outgoing ${pct(1 - s.incoming_share_pre)}`],
      ['Last event', s.recency_hours_pre < 1 ? `${num(s.recency_hours_pre * 3600)} sec` : `${num(s.recency_hours_pre, 1)} h`, 'before cutoff'],
      ['Amount index mean', num(s.amount_mean_pre, 3), `σ ${num(s.amount_std_pre, 3)}`],
      ['Interarrival CV', num(s.interarrival_cv_pre, 2), `burst ${num(s.burstiness_index_pre, 2)}`]
    ];
    $('#signal-kpis').innerHTML = kpis.map(k => `<div><span>${k[0]}</span><strong>${k[1]}</strong><small>${k[2]}</small></div>`).join('');

    const windows = [
      ['24h', s.pre_1d_count], ['3d', s.pre_3d_count], ['7d', s.pre_7d_count], ['30d', s.pre_30d_count], ['180d', s.pre_count]
    ];
    const max = Math.max(...windows.map(x => x[1]), 1);
    $('#window-bars').innerHTML = windows.map(([label, value]) => `
      <div class="bar-row"><span class="bar-label">${label}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.max(1, value/max*100)}%"></span></span><span class="bar-value">${num(value)}</span></div>`).join('');

    const mix = [
      ['Bank transfer', s.bank_otkazmasi_share_pre], ['Card', s.karta_share_pre], ['Cash', s.naqd_share_pre], ['International', s.xalqaro_share_pre]
    ];
    $('#mix-bars').innerHTML = mix.map(([label, value]) => `
      <div class="bar-row"><span class="bar-label">${label}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.max(.6, value*100)}%"></span></span><span class="bar-value">${pct(value)}</span></div>`).join('');

    const tags = [];
    if (s.pre_1d_count > D.medians.pre_1d_count * 1.45) tags.push(['24h activity above typical', 'attn']);
    else if (s.pre_1d_count < D.medians.pre_1d_count * .55) tags.push(['24h activity below typical', '']);
    if (s.recency_hours_pre < D.medians.recency_hours_pre) tags.push(['last event unusually close to cutoff', 'attn']);
    if (s.amount_std_pre > D.medians.amount_std_pre * 1.2) tags.push(['amount dispersion elevated', 'attn']);
    if (s.incoming_share_pre < D.medians.incoming_share_pre - .08) tags.push(['outgoing share elevated', 'attn']);
    if (s.burstiness_index_pre > D.medians.burstiness_index_pre + .08) tags.push(['transaction cadence more bursty', 'attn']);
    if (!tags.length) tags.push(['behavior close to test-set medians', '']);
    $('#context-tags').innerHTML = tags.slice(0,4).map(([t,c]) => `<span class="context-tag ${c}">${t}</span>`).join('');
  }

  function initSignalDesk() {
    const select = $('#signal-select');
    const signals = [...D.demoSignals].sort((a,b) => b.ehtimollik - a.ehtimollik);
    select.innerHTML = signals.map(s => `<option value="${s.signal_id}">${s.signal_id} · risk ${Math.round(s.ehtimollik*100)}</option>`).join('');
    const update = () => renderSignal(signals.find(s => s.signal_id === select.value) || signals[0]);
    select.addEventListener('change', update);
    document.addEventListener('keydown', e => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault(); select.focus();
      }
    });
    select.value = signals[0].signal_id;
    update();
  }

  function initEnsemble() {
    const root = $('#ensemble-chart');
    root.innerHTML = D.ensemble.map((m, i) => `
      <div class="ensemble-piece" style="width:${m.weight*100}%"><strong>${Math.round(m.weight*100)}%</strong><span>${m.name}</span></div>`).join('');
  }

  function initValidationBars() {
    const root = $('#validation-bars');
    const min = .57, max = .64;
    root.innerHTML = D.validation.map((m, i) => {
      const width = Math.max(0, Math.min(100, ((m.cv - min)/(max-min))*100));
      const final = i === D.validation.length - 1;
      return `<div class="val-row ${final?'final':''}"><span class="val-name">${m.model}</span><span class="val-track"><span class="val-fill" style="width:${width}%"></span></span><span class="val-num">${m.cv.toFixed(4)}</span><span class="val-num chrono-num">${m.chrono.toFixed(4)}</span></div>`;
    }).join('') + `<div style="display:grid;grid-template-columns:140px 1fr 64px 64px;gap:10px;margin-top:8px;color:#686f7b;font:9px var(--mono);text-transform:uppercase"><span></span><span></span><span style="text-align:right">CV</span><span style="text-align:right">Chrono</span></div>`;
  }

  function initHistogram() {
    const root = $('#score-hist');
    const max = Math.max(...D.histogram.map(b => b.count));
    root.innerHTML = D.histogram.map(b => `<div class="hist-bar" style="height:${(b.count/max)*100}%" data-label="${b.lo.toFixed(2)}–${b.hi.toFixed(2)} · ${b.count}"></div>`).join('');
  }

  function initMonthlyChart() {
    const svg = $('#eda-monthly-chart');
    if (!svg) return;
    const data = D.monthly;
    const W = 640, H = 220, pad = {l:38,r:16,t:14,b:34};
    const rates = data.map(d=>d.rate);
    const min = Math.min(...rates)-.01, max = Math.max(...rates)+.01;
    const x = i => pad.l + i*(W-pad.l-pad.r)/(data.length-1);
    const y = v => pad.t + (max-v)*(H-pad.t-pad.b)/(max-min);
    const path = data.map((d,i)=>`${i?'L':'M'} ${x(i).toFixed(1)} ${y(d.rate).toFixed(1)}`).join(' ');
    let html = `<line class="monthly-axis" x1="${pad.l}" y1="${H-pad.b}" x2="${W-pad.r}" y2="${H-pad.b}"/>`;
    html += `<path class="monthly-line" d="${path}"/>`;
    data.forEach((d,i)=>{ html += `<circle class="monthly-dot" cx="${x(i)}" cy="${y(d.rate)}" r="2.8"><title>${d.month}: ${pct(d.rate,1)} · n=${d.signals ?? ''}</title></circle>`; });
    [0,6,12,18,23].forEach(i=>{ html += `<text class="monthly-label" x="${x(i)}" y="${H-12}" text-anchor="middle">${data[i].month}</text>`; });
    [min,(min+max)/2,max].forEach(v=>{ html += `<text class="monthly-label" x="${pad.l-7}" y="${y(v)+3}" text-anchor="end">${pct(v,0)}</text>`; });
    svg.innerHTML = html;
  }


  function initEDA() {
    const E = D.eda;
    if (!E) return;

    const targetRoot = $('#target-distribution');
    if (targetRoot) {
      const total = E.target.dismissed + E.target.escalated;
      const dShare = E.target.dismissed / total;
      const eShare = E.target.escalated / total;
      targetRoot.innerHTML = `
        <div class="target-bar">
          <div class="target-segment dismissed" style="width:${dShare*100}%"><strong>${pct(dShare,1)}</strong><span>dismissed</span></div>
          <div class="target-segment escalated" style="width:${eShare*100}%"><strong>${pct(eShare,1)}</strong><span>escalated</span></div>
        </div>
        <div class="target-legend">
          <div><span>Dismissed</span><b>${num(E.target.dismissed)}</b></div>
          <div><span>Escalated</span><b>${num(E.target.escalated)}</b></div>
        </div>`;
    }

    const txRoot = $('#tx-count-hist');
    if (txRoot) {
      const max = Math.max(...E.txCountHistogram.map(d=>d.count));
      txRoot.innerHTML = E.txCountHistogram.map(d => {
        const h = Math.max(2, d.count / max * 100);
        return `<div class="eda-hist-item" style="--bar-height:${h}%"><div class="eda-hist-count">${num(d.count)}</div><div class="eda-hist-bar" style="height:${h}%"></div><span class="eda-hist-label">${d.label}</span></div>`;
      }).join('');
    }

    const recRoot = $('#recency-hist');
    if (recRoot) {
      const max = Math.max(...E.recencyHistogram.map(d=>d.count));
      recRoot.innerHTML = E.recencyHistogram.map((d,i) => {
        const h = Math.max(2, d.count / max * 100);
        return `<div class="recency-bin ${i < 3 ? 'hot' : ''}"><b>${num(d.count)}</b><div class="recency-column" style="height:${h}%"></div><span>${d.label}</span></div>`;
      }).join('');
    }

    const dirRoot = $('#direction-bar');
    if (dirRoot) {
      dirRoot.innerHTML = `
        <div class="direction-track"><span class="direction-in" style="width:${E.direction.incoming*100}%">${pct(E.direction.incoming,1)} incoming</span><span class="direction-out" style="width:${E.direction.outgoing*100}%">${pct(E.direction.outgoing,1)} outgoing</span></div>
        <div class="direction-meta"><span>Train</span><span>Test incoming ${pct(E.direction.testIncoming,1)}</span></div>`;
    }

    const typeRoot = $('#type-composition');
    if (typeRoot) {
      typeRoot.innerHTML = E.types.map(d => `<div class="type-row"><span>${d.label}</span><div class="type-track"><div class="type-fill" style="width:${Math.max(.7,d.share*100)}%"></div></div><span>${pct(d.share,1)}</span></div>`).join('');
    }

    const contrastRoot = $('#contrast-plot');
    if (contrastRoot) {
      const lim = .18;
      const fmt = d => {
        if (d.format === 'pct') return [pct(d.dismissed,1), pct(d.escalated,1)];
        if (d.format === 'count') return [num(d.dismissed,1), num(d.escalated,1)];
        if (d.format === 'hours') return [`${num(d.dismissed,1)}h`, `${num(d.escalated,1)}h`];
        return [num(d.dismissed,d.digits ?? 2), num(d.escalated,d.digits ?? 2)];
      };
      contrastRoot.innerHTML = E.contrasts.map(d => {
        const pos = Math.max(0, Math.min(100, 50 + (d.effect / lim) * 45));
        const [dismissed, escalated] = fmt(d);
        return `<div class="contrast-row"><span class="contrast-label">${d.label}</span><div class="effect-track"><span class="effect-dot ${d.effect>0?'pos':''}" style="left:${pos}%"><title>${d.label}: standardized mean difference ${d.effect.toFixed(3)}</title></span></div><span class="effect-value">D ${dismissed} · E ${escalated}<small>d=${d.effect>0?'+':''}${d.effect.toFixed(3)}</small></span></div>`;
      }).join('');
    }

    const amountRoot = $('#amount-range');
    if (amountRoot) {
      const min = -.9, max = .75;
      const x = v => Math.max(0, Math.min(100, (v-min)/(max-min)*100));
      amountRoot.innerHTML = E.amountQuantiles.map(d => `<div class="amount-row ${d.label.toLowerCase()}"><span>${d.label}</span><div class="amount-axis"><span class="amount-whisker" style="left:${x(d.q10)}%;width:${x(d.q90)-x(d.q10)}%"></span><span class="amount-iqr" style="left:${x(d.q25)}%;width:${x(d.q75)-x(d.q25)}%"></span><span class="amount-median" style="left:${x(d.median)}%"></span></div><span class="amount-values">median ${d.median.toFixed(3)}</span></div>`).join('');
    }

    const findingRoot = $('#negative-findings');
    if (findingRoot) {
      findingRoot.innerHTML = E.negativeFindings.map((d,i) => `<div class="finding-item"><span>0${i+1}</span><strong>${d.title}</strong><p>${d.detail}</p></div>`).join('');
    }
  }

  function initCutoffs() {
    $('#cutoff-body').innerHTML = D.cutoffs.map(c => `<tr><td><strong>${c.name}</strong><br><small style="color:#707783">${c.rule}</small></td><td>${c.cv.toFixed(4)}</td><td>${c.chrono.toFixed(4)}</td><td class="status-${c.status}">${c.status === 'selected' ? 'SELECTED' : 'REJECTED'}</td></tr>`).join('');
  }

  initMenu();
  initScrollProgress();
  initTeam();
  initSignalDesk();
  initEDA();
  initEnsemble();
  initValidationBars();
  initHistogram();
  initMonthlyChart();
  initCutoffs();
})();
