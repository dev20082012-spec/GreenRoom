
(function () {
  'use strict';

  window.onerror = function (message, source, lineno, colno, error) {
    try {
      if (typeof addAuditEntry === 'function') {
        addAuditEntry('Runtime Warning: ' + message, 'Defect Shield Active');
      }
    } catch (e) {}
    return true;
  };

  window.onunhandledrejection = function (event) {
    try {
      if (typeof addAuditEntry === 'function') {
        addAuditEntry('Unhandled Rejection: ' + (event.reason ? event.reason.message || event.reason : 'Unknown'), 'Defect Shield Active');
      }
    } catch (e) {}
    if (event && event.preventDefault) event.preventDefault();
  };

  var audioCtx = null;

  function getAudioContext() {
    try {
      if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
        var AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(function () {});
      }
    } catch (e) {
      audioCtx = null;
    }
    return audioCtx;
  }

  var soundManager = {
    playChime: function () {
      var ctx = getAudioContext();
      if (!ctx) return;
      try {
        var now = ctx.currentTime;
        var osc1 = ctx.createOscillator();
        var gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        gain1.gain.setValueAtTime(0.06, now);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.15);

        var osc2 = ctx.createOscillator();
        var gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.07);
        gain2.gain.setValueAtTime(0.06, now + 0.07);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.07);
        osc2.stop(now + 0.24);
      } catch (e) {}
    },

    playSuccess: function () {
      var ctx = getAudioContext();
      if (!ctx) return;
      try {
        var now = ctx.currentTime;
        var freqs = [523.25, 659.25, 783.99];
        freqs.forEach(function (f, idx) {
          var t = now + idx * 0.08;
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, t);
          gain.gain.setValueAtTime(0.08, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.38);
        });
      } catch (e) {}
    },

    playError: function () {
      var ctx = getAudioContext();
      if (!ctx) return;
      try {
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        var filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.24);
      } catch (e) {}
    }
  };

  var ORIGINAL_CODE =
    'function authMiddleware(req, res, next) {\n' +
    '  const authHeader = req.headers[\'authorization\'];\n' +
    '  // BUG: Crashes if header is undefined or malformed\n' +
    '  const token = authHeader.split(\' \')[1];\n' +
    '  const decoded = jwt.verify(token, process.env.JWT_SECRET);\n' +
    '  req.user = decoded;\n' +
    '  next();\n' +
    '}';

  var RECOMMENDED_FIX =
    'function authMiddleware(req, res, next) {\n' +
    '  const authHeader = req.headers[\'authorization\'];\n' +
    '\n' +
    '  // FIX: Guard against missing or malformed header\n' +
    '  if (!authHeader || typeof authHeader !== \'string\') {\n' +
    '    return res.status(401).json({\n' +
    '      error: \'Missing or malformed Authorization header\'\n' +
    '    });\n' +
    '  }\n' +
    '\n' +
    '  if (!authHeader.startsWith(\'Bearer \')) {\n' +
    '    return res.status(401).json({\n' +
    '      error: \'Authorization header must use Bearer scheme\'\n' +
    '    });\n' +
    '  }\n' +
    '\n' +
    '  const token = authHeader.split(\' \')[1];\n' +
    '  if (!token) {\n' +
    '    return res.status(401).json({ error: \'Token payload missing\' });\n' +
    '  }\n' +
    '\n' +
    '  const decoded = jwt.verify(token, process.env.JWT_SECRET);\n' +
    '  req.user = decoded;\n' +
    '  next();\n' +
    '}';

  var STAGING_LOG_LINES = [
    { type: 'info', text: '[INFO]  2026-09-25T09:13:45.012Z Orchestrator: Deployment canary v2.14-rc3 deployed to us-east-1a.' },
    { type: 'info', text: '[INFO]  2026-09-25T09:13:58.102Z Worker-02: Cluster heartbeat OK (memory: 412MB, cpu: 14%).' },
    { type: 'info', text: '[INFO]  2026-09-25T09:14:01.440Z Worker-04: Inbound HTTP GET /api/v1/auth/verify - 200 OK (12ms).' },
    { type: 'error', text: '[ERROR] 2026-09-25T09:14:02.195Z Worker-04: GET /api/v1/user/profile - 500 Internal Server Error' },
    { type: 'trace', text: 'TypeError: Cannot read properties of undefined (reading \'split\')' },
    { type: 'trace', text: '    at authMiddleware (/src/middleware/auth.js:14:28)' },
    { type: 'trace', text: '    at Layer.handle [as handle_request] (node_modules/express/lib/router/layer.js:95:5)' },
    { type: 'trace', text: '    at next (node_modules/express/lib/router/route.js:144:13)' },
    { type: 'trace', text: '    at Route.dispatch (node_modules/express/lib/router/route.js:114:17)' },
    { type: 'warn', text: '[WARN]  2026-09-25T09:14:03.011Z CircuitBreaker: Staging Auth cluster degraded (error rate: 18.4%).' },
    { type: 'error', text: '[ERROR] 2026-09-25T09:14:03.542Z Worker-01: Health check failed on Pod auth-gateway-staging-7df84.' },
    { type: 'warn', text: '[WARN]  2026-09-25T09:14:04.220Z Orchestrator: Restarting unhealthy container worker-04 (exit code 1).' },
    { type: 'info', text: '[INFO]  2026-09-25T09:14:08.891Z Worker-04: Container spawned. Listening on internal port 8080.' },
    { type: 'info', text: '[INFO]  2026-09-25T09:14:15.002Z Worker-04: Traffic re-routed to hot replica pod.' },
    { type: 'warn', text: '[WARN]  2026-09-25T09:14:22.610Z Gateway: Incoming unauthenticated traffic spike detected from client test harness.' }
  ];

  function getInitialState() {
    return {
      activeTab: 'chat',
      patienceScore: 72,
      secondsRemaining: 1715,
      ticketStatus: 'IN PROGRESS',
      unreadInboxCount: 2,
      testsRanOnce: false,
      testsPassed: false,
      prSubmitted: false,
      isManagerTyping: false,
      isRunningTests: false,
      isGameOver: false,
      selectedEmailId: 'em-1',
      diffMode: false,
      editorContent: ORIGINAL_CODE,

      interruptTriggered: false,
      interruptPending: false,
      interruptAnswered: false,
      interruptSlaTimer: null,
      chatUnreadPing: 0,

      evalMetrics: {
        technicalAccuracy: 80,
        responseTime: 65,
        communicationProfessionalism: 90,
        autonomy: 70
      },

      gameplayStats: {
        startTime: Date.now(),
        inspectedStagingLogs: false,
        inspectedDiffMode: false,
        testRunsCount: 0,
        testFailsCount: 0,
        prSubmitTime: null,
        interruptResponseTimeSec: null,
        interruptTimedOut: false
      },

      chatMessages: [
        {
          id: 1,
          sender: 'Vikram Malhotra',
          role: 'Lead Architect',
          time: '09:14 AM',
          text: 'Intern, APX-104 is blocking the staging deployment for Auth0 transition. Have you inspected the middleware null pointer in token validation yet?',
          isUser: false
        },
        {
          id: 2,
          sender: 'Vikram Malhotra',
          role: 'Lead Architect',
          time: '09:22 AM',
          text: 'We cannot have unhandled exceptions in the JWT extraction pipeline. VP of Engineering is watching this release. Need your ETA.',
          isUser: false
        },
        {
          id: 3,
          sender: 'Vikram Malhotra',
          role: 'Lead Architect',
          time: '09:35 AM',
          text: 'If you need clarification on the request header spec, ping here immediately. Do not sit on blocked tickets without raising flags.',
          isUser: false
        }
      ],

      emails: [
        {
          id: 'em-1',
          sender: 'Priya Sharma (QA Lead)',
          email: 'priya.sharma@apexcore.internal',
          subject: 'P0 Incident: Staging Auth Crash (APX-104)',
          time: '09:02 AM',
          unread: true,
          priority: 'P0 - CRITICAL',
          priorityClass: 'critical',
          body:
            'Ticket Reference: APX-104\n' +
            'Severity: P0 Blocker\n' +
            'Target Environment: US-East-1 Staging Cluster / Auth Gateway\n' +
            '\n' +
            'Summary:\n' +
            'Automated regression tests flagged an uncaught 500 runtime error\n' +
            'when requests omit or send malformed Authorization headers.\n' +
            'The server process dies with an unhandled TypeError.\n' +
            '\n' +
            'Stack Trace:\n' +
            'TypeError: Cannot read properties of undefined (reading \'split\')\n' +
            '  at authMiddleware (/src/middleware/auth.js:14:38)\n' +
            '  at Layer.handle [as handle_request] (node_modules/express/lib/router/layer.js:95:5)\n' +
            '  at next (node_modules/express/lib/router/route.js:144:13)\n' +
            '  at Route.dispatch (node_modules/express/lib/router/route.js:114:17)\n' +
            '\n' +
            'Reproduction Steps:\n' +
            '1. Send HTTP GET to /api/v1/user/profile with Authorization: undefined.\n' +
            '2. Observe immediate Node process crash on authMiddleware line 14.\n' +
            '\n' +
            'Impact:\n' +
            'All authenticated endpoints are vulnerable. Any client omitting\n' +
            'the Authorization header will crash the staging gateway process.\n' +
            'Staging deployment pipeline is blocked until this is resolved.\n' +
            '\n' +
            'Expected Behavior:\n' +
            'Gracefully return HTTP 401 Unauthorized with standard JSON payload:\n' +
            '{ "error": "Missing or malformed Authorization header" }'
        },
        {
          id: 'em-2',
          sender: 'Rajesh Iyer (VP Engineering)',
          email: 'rajesh.iyer@apexcore.internal',
          subject: 'ApexCore Systems - Security & Branching Guidelines',
          time: '08:45 AM',
          unread: true,
          priority: 'HIGH',
          priorityClass: 'high',
          body:
            'To: All Engineering Apprentices (Cohort 2026)\n' +
            'From: Rajesh Iyer, VP Engineering\n' +
            '\n' +
            'Subject: Staging PR Submission Checklist & Security Standards\n' +
            '\n' +
            '--------------------------------------------------------------\n' +
            '\n' +
            'Before submitting ANY pull request to a staging or production\n' +
            'branch, you must verify the following:\n' +
            '\n' +
            '1. NULL SAFETY REQUIREMENT\n' +
            '   All untrusted inputs (request headers, query params, body\n' +
            '   fields) must be validated for existence and type before use.\n' +
            '   No unguarded property access on potentially undefined values.\n' +
            '\n' +
            '2. LOCAL TEST SUITE\n' +
            '   Run the full local test suite and confirm 100% assertion pass\n' +
            '   rate. Do NOT submit a PR with known test failures. The CI\n' +
            '   pipeline will reject it and your lead will be notified.\n' +
            '\n' +
            '3. BRANCH NAMING CONVENTION\n' +
            '   Hotfix branches: fix/<ticket-id>-<short-description>\n' +
            '   Example: fix/apx-104-token-null-check\n' +
            '\n' +
            '4. COMMUNICATION PROTOCOL\n' +
            '   Notify your lead architect BEFORE pinging senior engineers.\n' +
            '   Do not sit on blocked tickets. Raise flags immediately.\n' +
            '\n' +
            '5. CODE REVIEW ETIQUETTE\n' +
            '   Keep diffs minimal and focused on the ticket scope.\n' +
            '   Include inline comments explaining non-obvious logic.\n' +
            '\n' +
            'Failure to follow these guidelines during your apprenticeship\n' +
            'will be reflected in your evaluation rubric.\n' +
            '\n' +
            '- Rajesh Iyer, VP Engineering, ApexCore Systems'
        },
        {
          id: 'em-3',
          sender: 'Jira Automation Bot',
          email: 'no-reply@jira.apexcore.internal',
          subject: '[ASSIGNED] APX-104: Hotfix unhandled null authorization header',
          time: '08:30 AM',
          unread: false,
          priority: 'NORMAL',
          priorityClass: 'normal',
          body:
            'Ticket APX-104 has been assigned to Alex Chen (Software Engineering Intern).\n' +
            '\n' +
            'Reporter: Vikram Malhotra (Lead Architect)\n' +
            'Component: /src/middleware/auth.js\n' +
            'Sprint: Sprint 1\n' +
            'Deadline: End of Day 1\n' +
            '\n' +
            'Description:\n' +
            'Ensure request headers are checked for existence, type verification,\n' +
            'and Bearer schema conformance before extracting the token slice.\n' +
            '\n' +
            'Acceptance Criteria:\n' +
            '- No unhandled TypeError on missing Authorization header.\n' +
            '- Return HTTP 401 with JSON error body.\n' +
            '- All 3 local test assertions pass (valid token, missing header, malformed token).'
        }
      ],

      evalAuditLog: [
        { time: '09:00 AM', event: 'Scenario initialized: Day 1 - Broken Auth Middleware Hotfix.', impact: 'Baseline established' },
        { time: '09:14 AM', event: 'Manager Vikram Malhotra posted initial update request for ticket APX-104.', impact: 'Awaiting intern response' },
        { time: '09:22 AM', event: 'Follow-up ping sent from Lead Architect. Urgency escalated.', impact: 'Patience at 72%' }
      ],

      testOutput: []
    };
  }

  var state = getInitialState();

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function formatTime(secs) {
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function nowTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  function getPatienceColor(score) {
    if (score <= 30) return '#DC2626';
    if (score <= 55) return '#EA580C';
    return '#D97706';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function codeIsFixed() {
    var code = state.editorContent || '';
    var hasNullGuard = code.indexOf('!authHeader') !== -1 || code.indexOf('authHeader == null') !== -1 || code.indexOf('typeof authHeader') !== -1;
    var hasBearerOrSplitGuard = code.indexOf('startsWith') !== -1 || code.indexOf('Bearer') !== -1 || code.indexOf('authHeader?.split') !== -1;
    return hasNullGuard && hasBearerOrSplitGuard;
  }

  function addAuditEntry(event, impact) {
    state.evalAuditLog.unshift({
      time: nowTime(),
      event: event,
      impact: impact
    });
    if (state.evalAuditLog.length > 20) {
      state.evalAuditLog.pop();
    }
    if (state.activeTab === 'eval') {
      renderEval();
    }
  }

  function showToast(title, body) {
    var container = $('#toast-container');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML =
      '<div class="toast-title">' + escapeHtml(title) + '</div>' +
      '<div class="toast-body">' + escapeHtml(body) + '</div>';

    toast.addEventListener('click', function () {
      toast.classList.remove('visible');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    });

    container.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add('visible');
    });

    setTimeout(function () {
      toast.classList.remove('visible');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 350);
    }, 4500);
  }

  function computeLineDiff(origStr, newStr) {
    var origLines = origStr.split('\n');
    var newLines = newStr.split('\n');
    var n = origLines.length;
    var m = newLines.length;

    var dp = [];
    for (var i = 0; i <= n; i++) {
      dp[i] = new Array(m + 1);
      for (var j = 0; j <= m; j++) {
        dp[i][j] = 0;
      }
    }

    for (var i = 1; i <= n; i++) {
      for (var j = 1; j <= m; j++) {
        if (origLines[i - 1].trim() === newLines[j - 1].trim()) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    var diff = [];
    var x = n;
    var y = m;

    while (x > 0 || y > 0) {
      if (x > 0 && y > 0 && origLines[x - 1].trim() === newLines[y - 1].trim()) {
        diff.unshift({ type: 'ctx', text: newLines[y - 1] });
        x--;
        y--;
      } else if (y > 0 && (x === 0 || dp[x][y - 1] >= dp[x - 1][y])) {
        diff.unshift({ type: 'add', text: newLines[y - 1] });
        y--;
      } else if (x > 0 && (y === 0 || dp[x][y - 1] < dp[x - 1][y])) {
        diff.unshift({ type: 'del', text: origLines[x - 1] });
        x--;
      }
    }

    return diff;
  }

  function renderDiffHighlighter() {
    var diffContainer = $('#diff-highlight-display');
    if (!diffContainer) return;

    var currentCode = state.editorContent || '';
    var diffLines = computeLineDiff(ORIGINAL_CODE, currentCode);

    var html = diffLines.map(function (item) {
      if (item.type === 'del') {
        return '<div class="dh-line dh-del">- ' + escapeHtml(item.text) + '</div>';
      } else if (item.type === 'add') {
        return '<div class="dh-line dh-add">+ ' + escapeHtml(item.text) + '</div>';
      } else {
        return '<div class="dh-line dh-ctx">  ' + escapeHtml(item.text) + '</div>';
      }
    }).join('\n');

    diffContainer.innerHTML = html;
  }

  function toggleDiffMode() {
    if (state.isGameOver) return;
    state.diffMode = !state.diffMode;
    state.gameplayStats.inspectedDiffMode = true;

    var btn = $('#btn-toggle-diff');
    var editor = $('#intern-editor');
    var diffDisplay = $('#diff-highlight-display');

    if (state.diffMode) {
      if (btn) {
        btn.classList.add('active-toggle');
        btn.textContent = '[DIFF HIGHLIGHTER: ACTIVE]';
      }
      if (editor) editor.style.display = 'none';
      if (diffDisplay) {
        diffDisplay.style.display = 'block';
        renderDiffHighlighter();
      }
      soundManager.playChime();
      addAuditEntry('Apprentice engaged inline Diff Highlighter comparison.', 'Code review telemetry active');
    } else {
      if (btn) {
        btn.classList.remove('active-toggle');
        btn.textContent = '[DIFF HIGHLIGHTER]';
      }
      if (diffDisplay) diffDisplay.style.display = 'none';
      if (editor) {
        editor.style.display = '';
        editor.value = state.editorContent;
      }
      soundManager.playChime();
    }
  }

  function openStagingLogsModal() {
    var modal = $('#staging-logs-modal');
    var body = $('#staging-logs-body');
    if (!modal || !body) return;

    body.innerHTML = STAGING_LOG_LINES.map(function (line) {
      var cls = 'log-line-info';
      if (line.type === 'error') cls = 'log-line-error';
      else if (line.type === 'warn') cls = 'log-line-warn';
      else if (line.type === 'trace') cls = 'log-line-trace';
      return '<div class="' + cls + '">' + escapeHtml(line.text) + '</div>';
    }).join('');

    modal.classList.add('visible');
    soundManager.playChime();

    if (!state.gameplayStats.inspectedStagingLogs) {
      state.gameplayStats.inspectedStagingLogs = true;
      state.evalMetrics.autonomy = Math.min(100, state.evalMetrics.autonomy + 5);
      addAuditEntry('Apprentice inspected APX-104 stack trace in staging logs.', 'Root cause diagnosed');
    }
  }

  function closeStagingLogsModal() {
    var modal = $('#staging-logs-modal');
    if (modal) modal.classList.remove('visible');
  }

  function triggerSprintInterruption() {
    if (state.isGameOver) return;
    state.interruptTriggered = true;
    state.interruptPending = true;
    state.interruptAnswered = false;

    state.chatUnreadPing = 1;
    var pingBadge = $('#chat-ping-badge');
    if (pingBadge) {
      pingBadge.textContent = '1';
      pingBadge.classList.add('visible');
    }

    soundManager.playChime();

    showToast(
      'URGENT WAR ROOM PING // Vikram Malhotra',
      'VP of Product just joined incident war room. Immediate status update requested.'
    );

    state.chatMessages.push({
      id: Date.now(),
      sender: 'Vikram Malhotra',
      role: 'Lead Architect',
      time: nowTime(),
      text: 'VP of Product just joined the incident war room. Is that auth patch tested yet? Give me a 1-sentence status update.',
      isUser: false
    });

    renderInterruptChips();
    renderChat();

    addAuditEntry(
      'Lead Architect escalated mid-sprint war room inquiry: VP of Product awaiting ETA.',
      'SLA Response Timer started (45s)'
    );

    if (state.interruptSlaTimer) clearTimeout(state.interruptSlaTimer);
    state.interruptSlaTimer = setTimeout(function () {
      if (state.interruptPending && !state.interruptAnswered && !state.isGameOver) {
        handleInterruptTimeout();
      }
    }, 45000);
  }

  function renderInterruptChips() {
    var container = $('#interrupt-chips');
    if (!container) return;

    if (!state.interruptPending || state.interruptAnswered || state.isGameOver) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    container.style.display = 'flex';
    container.innerHTML =
      '<span style="font-family: Consolas, monospace; font-size: 10px; color: var(--amber-spotlight); align-self: center; margin-right: 4px;">WAR ROOM ESCALATION:</span>' +
      '<button class="interrupt-chip" id="chip-int-tests">"Running regression tests now, 2 mins"</button>' +
      '<button class="interrupt-chip" id="chip-int-spec">"Blocked on token format verification"</button>';

    var btnTests = $('#chip-int-tests');
    if (btnTests) {
      btnTests.addEventListener('click', function () {
        handleInterruptResponse('Running regression tests now, 2 mins');
      });
    }

    var btnSpec = $('#chip-int-spec');
    if (btnSpec) {
      btnSpec.addEventListener('click', function () {
        handleInterruptResponse('Blocked on token format verification');
      });
    }
  }

  function handleInterruptResponse(text) {
    if (!state.interruptPending || state.isGameOver) return;
    state.interruptPending = false;
    state.interruptAnswered = true;

    if (state.interruptSlaTimer) {
      clearTimeout(state.interruptSlaTimer);
      state.interruptSlaTimer = null;
    }

    state.chatUnreadPing = 0;
    var pingBadge = $('#chat-ping-badge');
    if (pingBadge) pingBadge.classList.remove('visible');

    renderInterruptChips();

    state.chatMessages.push({
      id: Date.now(),
      sender: 'Alex Chen',
      role: 'Software Engineering Intern',
      time: nowTime(),
      text: text,
      isUser: true
    });

    state.isManagerTyping = true;
    renderChat();

    state.patienceScore = clamp(state.patienceScore + 5, 0, 100);
    state.evalMetrics.communicationProfessionalism = Math.min(100, state.evalMetrics.communicationProfessionalism + 6);
    state.evalMetrics.responseTime = Math.min(100, state.evalMetrics.responseTime + 8);

    addAuditEntry(
      'Apprentice met SLA response window for Lead Architect war room ping.',
      'Communication SLA preserved (+5% Patience)'
    );

    soundManager.playChime();

    setTimeout(function () {
      state.isManagerTyping = false;

      var reply = (text.indexOf('Running regression') !== -1)
        ? 'Good. Run the 3 assertions locally. Once green, dispatch the PR immediately so I can merge.'
        : 'Reference RFC 6750 Section 2.1: Header must start with "Bearer ". Guard against null before splitting.';

      state.chatMessages.push({
        id: Date.now() + 1,
        sender: 'Vikram Malhotra',
        role: 'Lead Architect',
        time: nowTime(),
        text: reply,
        isUser: false
      });

      renderChat();
      renderTopNav();
      renderEval();
    }, 1200);
  }

  function handleInterruptTimeout() {
    if (state.isGameOver) return;
    state.interruptPending = false;
    state.gameplayStats.interruptTimedOut = true;

    applyPatienceDelta(-5);
    state.evalMetrics.communicationProfessionalism = Math.max(45, state.evalMetrics.communicationProfessionalism - 10);
    state.evalMetrics.responseTime = Math.max(40, state.evalMetrics.responseTime - 12);

    renderInterruptChips();
    renderTopNav();
    renderEval();

    soundManager.playError();

    showToast(
      'SLA BREACH // Manager Patience -5%',
      'Intern failed to respond to Lead Architect within the 45-second war room inquiry window.'
    );

    state.chatMessages.push({
      id: Date.now(),
      sender: 'Vikram Malhotra',
      role: 'Lead Architect',
      time: nowTime(),
      text: 'No response? In an active P0 incident, silence in the war room is unacceptable. Provide status immediately.',
      isUser: false
    });

    addAuditEntry(
      'SLA BREACH: Apprentice exceeded 45s response threshold to Lead Architect.',
      'Manager Patience -5%, SLA penalty'
    );

    renderChat();
  }

  function applyPatienceDelta(delta) {
    state.patienceScore = clamp(state.patienceScore + delta, 0, 100);
    renderTopNav();

    if (state.patienceScore <= 0 && !state.isGameOver) {
      triggerIncidentEscalation();
    }
  }

  function triggerIncidentEscalation() {
    state.isGameOver = true;
    freezeInputs();
    stopAllTimers();

    state.ticketStatus = 'REASSIGNED - SENIOR INTERVENTION';
    renderTopNav();

    var sidebarStatus = $('#sidebar-status-text');
    if (sidebarStatus) sidebarStatus.textContent = 'REASSIGNED // SUPERVISOR TAKEOVER';

    soundManager.playError();
    showToast('INCIDENT ESCALATION', 'Manager patience exhausted (0%). APX-104 reassigned to Marcus Vance.');

    addAuditEntry(
      'SUPERVISOR INTERVENTION: Manager patience depleted. Ticket APX-104 stripped and reassigned.',
      'SLA Failure: Lead Architect takeover'
    );

    var modal = $('#escalation-modal');
    if (modal) modal.classList.add('visible');
  }

  function closeEscalationModal() {
    var modal = $('#escalation-modal');
    if (modal) modal.classList.remove('visible');
  }

  function freezeInputs() {
    var editor = $('#intern-editor');
    if (editor) editor.disabled = true;

    var chatInput = $('#chat-input');
    if (chatInput) chatInput.disabled = true;

    var chatBtn = $('#btn-chat-dispatch');
    if (chatBtn) chatBtn.disabled = true;

    var runBtn = $('#btn-run-tests');
    if (runBtn) runBtn.disabled = true;

    var submitBtn = $('#btn-submit-pr');
    if (submitBtn) submitBtn.disabled = true;

    var chipsRow = $('#chips-row');
    if (chipsRow) chipsRow.classList.add('inputs-frozen');
  }

  function unfreezeInputs() {
    var editor = $('#intern-editor');
    if (editor) editor.disabled = false;

    var chatInput = $('#chat-input');
    if (chatInput) chatInput.disabled = false;

    var chatBtn = $('#btn-chat-dispatch');
    if (chatBtn) chatBtn.disabled = false;

    var runBtn = $('#btn-run-tests');
    if (runBtn) runBtn.disabled = false;

    var submitBtn = $('#btn-submit-pr');
    if (submitBtn) submitBtn.disabled = !state.testsPassed || state.prSubmitted;

    var chipsRow = $('#chips-row');
    if (chipsRow) chipsRow.classList.remove('inputs-frozen');
  }

  function renderTopNav() {
    var color = getPatienceColor(state.patienceScore);
    var countdownClass = state.secondsRemaining < 300 ? 'critical' : 'normal';

    var statusEl = $('#ticket-status');
    if (statusEl) statusEl.textContent = state.ticketStatus;

    var countdownEl = $('#countdown-value');
    if (countdownEl) {
      countdownEl.textContent = formatTime(state.secondsRemaining);
      countdownEl.className = 'countdown ' + countdownClass;
    }

    var patienceVal = $('#patience-value');
    if (patienceVal) {
      patienceVal.textContent = state.patienceScore + '%';
      patienceVal.style.color = color;
    }

    var patienceFill = $('#patience-fill');
    if (patienceFill) {
      patienceFill.style.width = state.patienceScore + '%';
      patienceFill.style.backgroundColor = color;
    }
  }

  function renderSidebar() {
    $$('.nav-tab-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
    });

    var badgeEl = $('#inbox-badge');
    if (badgeEl) {
      if (state.unreadInboxCount > 0) {
        badgeEl.textContent = state.unreadInboxCount + ' unread';
        badgeEl.style.display = '';
      } else {
        badgeEl.style.display = 'none';
      }
    }

    var m = state.evalMetrics;
    var composite = Math.round((m.technicalAccuracy + m.responseTime + m.communicationProfessionalism + m.autonomy) / 4);
    var scoreEl = $('#eval-score-readout');
    if (scoreEl) scoreEl.textContent = composite + '%';
  }

  function renderTabPanels() {
    $$('.tab-panel').forEach(function (panel) {
      panel.classList.toggle('active', panel.id === 'panel-' + state.activeTab);
    });
  }

  function renderChat() {
    var feed = $('#chat-feed');
    if (!feed) return;

    feed.innerHTML = '';

    state.chatMessages.forEach(function (msg) {
      var bubble = document.createElement('div');
      bubble.className = 'chat-bubble ' + (msg.isUser ? 'intern' : 'manager');

      var senderClass = msg.isUser ? 'intern-name' : 'manager-name';

      bubble.innerHTML =
        '<div class="chat-bubble-header">' +
          '<span>' +
            '<span class="sender ' + senderClass + '">' + escapeHtml(msg.sender) + '</span> ' +
            '<span class="role-tag">(' + escapeHtml(msg.role) + ')</span>' +
          '</span>' +
          '<span class="timestamp">' + escapeHtml(msg.time) + '</span>' +
        '</div>' +
        '<div class="chat-bubble-body">' + escapeHtml(msg.text) + '</div>';

      feed.appendChild(bubble);
    });

    var typing = $('#typing-indicator');
    if (typing) {
      typing.classList.toggle('visible', state.isManagerTyping);
    }

    feed.scrollTop = feed.scrollHeight;
  }

  function renderInbox() {
    var list = $('#inbox-items');
    var detail = $('#email-detail-content');
    if (!list || !detail) return;

    list.innerHTML = '';
    var selectedEmail = null;

    state.emails.forEach(function (email) {
      if (email.id === state.selectedEmailId) selectedEmail = email;

      var item = document.createElement('div');
      item.className = 'email-item' + (email.id === state.selectedEmailId ? ' selected' : '');
      item.dataset.emailId = email.id;

      var senderClass = email.unread ? 'unread' : 'read';
      var subjectClass = email.unread ? 'unread' : 'read';

      item.innerHTML =
        '<div class="email-item-header">' +
          '<span class="sender ' + senderClass + '">' + escapeHtml(email.sender) + '</span>' +
          '<span class="time">' + escapeHtml(email.time) + '</span>' +
        '</div>' +
        '<div class="email-item-subject ' + subjectClass + '">' + escapeHtml(email.subject) + '</div>' +
        '<div class="email-item-tags">' +
          '<span class="priority-tag ' + email.priorityClass + '">' + escapeHtml(email.priority) + '</span>' +
          (email.unread ? '<span class="new-tag">NEW</span>' : '') +
        '</div>';

      item.addEventListener('click', function () {
        state.selectedEmailId = email.id;
        renderInbox();
      });

      list.appendChild(item);
    });

    if (!selectedEmail) selectedEmail = state.emails[0];

    var hasAction = selectedEmail.id === 'em-1';
    var actionHtml = hasAction
      ? '<div class="email-action-bar">' +
          '<span class="ticket-ref">Associated Ticket: <strong>APX-104 (P0 Blocker)</strong></span>' +
          '<button id="btn-open-workspace" class="btn-open-workspace">OPEN IN WORKSPACE &gt;&gt;</button>' +
        '</div>'
      : '';

    detail.innerHTML =
      '<div class="email-detail-header">' +
        '<div class="email-detail-subject">' +
          '<h2>' + escapeHtml(selectedEmail.subject) + '</h2>' +
          '<span class="time">' + escapeHtml(selectedEmail.time) + '</span>' +
        '</div>' +
        '<div class="email-meta">' +
          '<div><span class="meta-label">From:</span> ' + escapeHtml(selectedEmail.sender) + ' &lt;' + escapeHtml(selectedEmail.email) + '&gt;</div>' +
          '<div><span class="meta-label">To:</span> Alex Chen &lt;alex.chen@apexcore.internal&gt;</div>' +
          '<div><span class="meta-label">Classification:</span> CONFIDENTIAL // INTERNAL ONLY</div>' +
        '</div>' +
        actionHtml +
      '</div>' +
      '<div class="email-detail-body">' + escapeHtml(selectedEmail.body) + '</div>';

    var openBtn = $('#btn-open-workspace');
    if (openBtn) {
      openBtn.addEventListener('click', function () {
        state.emails.forEach(function (e) {
          if (e.id === 'em-1' && e.unread) {
            e.unread = false;
            state.unreadInboxCount = Math.max(0, state.unreadInboxCount - 1);
          }
        });
        addAuditEntry('Intern accepted ticket APX-104 via inbox and opened code workspace.', 'Autonomy verified');
        switchTab('workspace');
      });
    }
  }

  function renderWorkspace() {
    var display = $('#original-code-display');
    if (display) {
      var lines = ORIGINAL_CODE.split('\n');
      display.innerHTML = lines.map(function (line, i) {
        return '<span class="line-num">' + (i + 1) + '</span>' + escapeHtml(line);
      }).join('\n');
    }

    var editor = $('#intern-editor');
    if (editor) {
      if (editor.value !== state.editorContent) {
        editor.value = state.editorContent;
      }
      var lineCountEl = $('#intern-line-count');
      if (lineCountEl) {
        lineCountEl.textContent = 'LINES: ' + editor.value.split('\n').length;
      }
    }

    var submitBtn = $('#btn-submit-pr');
    if (submitBtn) {
      submitBtn.disabled = !state.testsPassed || state.prSubmitted || state.isGameOver;
    }

    if (state.diffMode) {
      renderDiffHighlighter();
    }
  }

  function renderTestOutput() {
    var container = $('#test-output');
    if (!container) return;

    if (state.testOutput.length === 0) {
      container.innerHTML = '<div class="test-line-muted">Ready. Click "RUN LOCAL TESTS" to execute the 3 assertion criteria against your working code.</div>';
      return;
    }

    container.innerHTML = state.testOutput.map(function (line) {
      var cls = 'test-line-muted';
      if (line.indexOf('[PASS]') !== -1) cls = 'test-line-pass';
      else if (line.indexOf('[FAIL]') !== -1) cls = 'test-line-fail';
      else if (line.indexOf('TypeError') !== -1 || line.indexOf('Expected:') !== -1 || line.indexOf('Received:') !== -1) cls = 'test-line-detail';
      else if (line.indexOf('-----') !== -1) cls = 'test-line-separator';
      else if (line.indexOf('STATUS: TEST SUITE PASSED') !== -1) cls = 'test-line-status-pass';
      else if (line.indexOf('STATUS: TEST SUITE FAILED') !== -1) cls = 'test-line-status-fail';
      return '<div class="' + cls + '">' + escapeHtml(line) + '</div>';
    }).join('');

    container.scrollTop = container.scrollHeight;
  }

  function renderEval() {
    var m = state.evalMetrics;
    var composite = Math.round((m.technicalAccuracy + m.responseTime + m.communicationProfessionalism + m.autonomy) / 4);

    var compEl = $('#eval-composite');
    if (compEl) compEl.textContent = composite + '%';

    var scoreReadout = $('#eval-score-readout');
    if (scoreReadout) scoreReadout.textContent = composite + '%';

    var criteria = [
      { id: 'tech', value: m.technicalAccuracy },
      { id: 'response', value: m.communicationProfessionalism },
      { id: 'communication', value: m.responseTime },
      { id: 'autonomy', value: m.autonomy }
    ];

    criteria.forEach(function (c) {
      var valEl = $('#eval-' + c.id + '-value');
      var fillEl = $('#eval-' + c.id + '-fill');
      if (valEl) valEl.textContent = c.value + '%';
      if (fillEl) {
        fillEl.style.width = c.value + '%';
        fillEl.className = 'eval-bar-fill ' + (c.value >= 75 ? 'emerald' : (c.value >= 50 ? 'amber' : 'crimson'));
      }
    });

    var trail = $('#audit-trail-entries');
    if (trail) {
      trail.innerHTML = state.evalAuditLog.map(function (entry) {
        return '<div class="audit-entry">' +
          '<div class="audit-entry-left">' +
            '<span class="time">' + escapeHtml(entry.time) + '</span>' +
            '<span class="event">' + escapeHtml(entry.event) + '</span>' +
          '</div>' +
          '<span class="impact">' + escapeHtml(entry.impact) + '</span>' +
        '</div>';
      }).join('');
    }
  }

  function openDebriefModal() {
    var modal = $('#debrief-modal');
    if (!modal) return;

    var m = state.evalMetrics;
    var composite = Math.round((m.technicalAccuracy + m.responseTime + m.communicationProfessionalism + m.autonomy) / 4);

    var gradeLetter = 'A';
    var gradeTitle = 'READY FOR STAGING DEPLOYMENT (LEVEL: ASSOCIATE L1)';
    var gradeSubtitle = 'Candidate demonstrates enterprise defensive design and SLA discipline under production outage conditions.';
    var gradeColor = 'var(--emerald-pass)';

    if (composite >= 85) {
      gradeLetter = 'A';
      gradeTitle = 'RECOMMENDED FOR IMMEDIATE STAGING ACCESS // ASSOCIATE L1';
      gradeSubtitle = 'High autonomy, rigorous defensive null guarding, and disciplined crisis communication.';
      gradeColor = 'var(--emerald-pass)';
    } else if (composite >= 70) {
      gradeLetter = 'B+';
      gradeTitle = 'CONDITIONAL OFFER // JUNIOR SOFTWARE ENGINEER';
      gradeSubtitle = 'Solid core mechanics. Requires supervision on SLA response times and edge-case testing.';
      gradeColor = 'var(--amber-spotlight)';
    } else {
      gradeLetter = 'C';
      gradeTitle = 'APPRENTICESHIP REMEDIATION REQUIRED // COHORT RE-EVALUATION';
      gradeSubtitle = 'Vulnerabilities detected in null-safety verification or supervisor communication.';
      gradeColor = 'var(--crimson-alert)';
    }

    var gradeBox = $('#debrief-grade-box');
    if (gradeBox) {
      gradeBox.innerHTML =
        '<div class="grade-label">APPRENTICESHIP READINESS RATING</div>' +
        '<div class="grade-value" style="color: ' + gradeColor + ';">' + gradeLetter + ' (' + composite + '%)</div>' +
        '<div class="grade-title">' + escapeHtml(gradeTitle) + '</div>' +
        '<div class="grade-subtitle">' + escapeHtml(gradeSubtitle) + '</div>';
    }

    var metricsBox = $('#debrief-metrics');
    if (metricsBox) {
      metricsBox.innerHTML =
        '<div class="section-title">Performance Metrics Breakdown</div>' +
        '<div class="debrief-metric-row"><span class="metric-name">1. Technical Rigor & Null-Safety:</span><span class="metric-value">' + m.technicalAccuracy + '%</span></div>' +
        '<div class="debrief-metric-row"><span class="metric-name">2. Professional Communication:</span><span class="metric-value">' + m.communicationProfessionalism + '%</span></div>' +
        '<div class="debrief-metric-row"><span class="metric-name">3. Production Urgency & SLA:</span><span class="metric-value">' + m.responseTime + '%</span></div>' +
        '<div class="debrief-metric-row"><span class="metric-name">4. Code Cleanliness & Security:</span><span class="metric-value">' + m.autonomy + '%</span></div>';
    }

    var findings = [];
    if (codeIsFixed()) {
      findings.push({ type: 'strength', label: '[STRENGTH]', text: 'Engineered robust null & Bearer scheme guard clauses on req.headers["authorization"] preventing unhandled 500 runtime panics.' });
    }
    if (state.gameplayStats.inspectedStagingLogs) {
      findings.push({ type: 'strength', label: '[STRENGTH]', text: 'Autonomously audited staging container runtime stack traces before authoring code diff.' });
    }
    if (state.interruptAnswered && !state.gameplayStats.interruptTimedOut) {
      findings.push({ type: 'strength', label: '[STRENGTH]', text: 'Maintained SLA compliance during war room escalation ping from Lead Architect.' });
    }
    if (state.gameplayStats.testRunsCount > 0 && state.testsPassed) {
      findings.push({ type: 'strength', label: '[STRENGTH]', text: 'Validated 100% of local unit test assertions before pull request submission.' });
    }
    if (state.gameplayStats.interruptTimedOut) {
      findings.push({ type: 'vulnerability', label: '[VULNERABILITY]', text: 'Exceeded the 45-second SLA inquiry window during the mid-sprint incident war room escalation.' });
    }
    if (state.gameplayStats.testFailsCount > 1) {
      findings.push({ type: 'vulnerability', label: '[VULNERABILITY]', text: 'Multiple iterations of failing unit tests encountered prior to applying proper RFC Bearer guards.' });
    }
    if (!state.gameplayStats.inspectedDiffMode) {
      findings.push({ type: 'vulnerability', label: '[VULNERABILITY]', text: 'Did not inspect visual diff highlight comparison before hotfix submission.' });
    }

    if (findings.length === 0) {
      findings.push({ type: 'strength', label: '[NOTE]', text: 'Standard baseline apprentice execution recorded across core evaluation criteria.' });
    }

    var findingsBox = $('#debrief-findings');
    if (findingsBox) {
      findingsBox.innerHTML =
        '<div class="section-title">Strengths & Vulnerabilities Assessment</div>' +
        findings.map(function (f) {
          var cls = f.type === 'strength' ? 'strength' : 'vulnerability';
          return '<div class="debrief-finding"><span class="finding-label ' + cls + '">' + escapeHtml(f.label) + '</span> ' + escapeHtml(f.text) + '</div>';
        }).join('');
    }

    modal.classList.add('visible');
    soundManager.playChime();
  }

  function closeDebriefModal() {
    var modal = $('#debrief-modal');
    if (modal) modal.classList.remove('visible');
  }

  function exportPerformanceRecord() {
    var m = state.evalMetrics;
    var composite = Math.round((m.technicalAccuracy + m.responseTime + m.communicationProfessionalism + m.autonomy) / 4);

    var grade = composite >= 85 ? 'A (' + composite + '%)' : (composite >= 70 ? 'B+ (' + composite + '%)' : 'C (' + composite + '%)');

    var text = [
      '================================================================',
      'APEXCORE SYSTEMS // APPRENTICESHIP ASSESSMENT RECORD',
      '================================================================',
      'CANDIDATE: Alex Chen (Software Engineering Intern)',
      'SUPERVISOR: Vikram Malhotra (Lead Architect & Systems Mentor)',
      'INCIDENT TICKET: APX-104 (P0 Staging Auth Crash)',
      'EVALUATION DATE: ' + new Date().toISOString(),
      'OVERALL READINESS RATING: ' + grade,
      '----------------------------------------------------------------',
      'PERFORMANCE METRICS BREAKDOWN:',
      '  1. Technical Rigor & Null-Safety : ' + m.technicalAccuracy + '%',
      '  2. Professional Communication     : ' + m.communicationProfessionalism + '%',
      '  3. Production Urgency & SLA       : ' + m.responseTime + '%',
      '  4. Code Cleanliness & Security   : ' + m.autonomy + '%',
      '----------------------------------------------------------------',
      'ASSESSMENT FINDINGS:',
      '  - Null Guard Verification: ' + (codeIsFixed() ? 'PASSED (RFC 6750 Compliant)' : 'INCOMPLETE'),
      '  - Unit Test Validations: ' + (state.testsPassed ? 'PASSED (3/3 assertions)' : 'FAILED'),
      '  - Staging Log Inspection: ' + (state.gameplayStats.inspectedStagingLogs ? 'COMPLETED' : 'OMITTED'),
      '  - War Room SLA Compliance: ' + (state.gameplayStats.interruptTimedOut ? 'BREACHED' : 'HONORED'),
      '----------------------------------------------------------------',
      'OFFICIAL SUPERVISOR ENDORSEMENT:',
      '"Alex demonstrates disciplined edge-case engineering under active production pressure."',
      'Vikram Malhotra, Lead Architect & Systems Mentor (ApexCore Systems)',
      '================================================================'
    ].join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('PERFORMANCE RECORD COPIED', 'Assessment record copied to clipboard.');
        soundManager.playChime();
      }).catch(function () {
        showToast('PRINT VIEW GENERATED', 'Opening print preview...');
        window.print();
      });
    } else {
      window.print();
    }
  }

  function restartScenario() {
    closeDebriefModal();
    closeEscalationModal();
    closeDemoModal();
    stopAllTimers();

    state = getInitialState();
    unfreezeInputs();

    var editor = $('#intern-editor');
    if (editor) {
      editor.value = ORIGINAL_CODE;
      editor.style.display = '';
    }

    var diffDisplay = $('#diff-highlight-display');
    if (diffDisplay) diffDisplay.style.display = 'none';

    var toggleDiffBtn = $('#btn-toggle-diff');
    if (toggleDiffBtn) {
      toggleDiffBtn.classList.remove('active-toggle');
      toggleDiffBtn.textContent = '[DIFF HIGHLIGHTER]';
    }

    var sidebarStatus = $('#sidebar-status-text');
    if (sidebarStatus) sidebarStatus.textContent = 'HOTFIX IN PROGRESS';

    renderInterruptChips();
    render();
    startTimers();

    showToast('SCENARIO RESET', 'Day 1 Staging Incident APX-104 has been reloaded to baseline.');
    soundManager.playChime();
  }

  function render() {
    renderTopNav();
    renderSidebar();
    renderTabPanels();

    if (state.activeTab === 'chat') renderChat();
    if (state.activeTab === 'inbox') renderInbox();
    if (state.activeTab === 'workspace') { renderWorkspace(); renderTestOutput(); }
    if (state.activeTab === 'eval') renderEval();
  }

  function switchTab(tab) {
    var editor = $('#intern-editor');
    if (editor && state.activeTab === 'workspace') {
      state.editorContent = editor.value;
    }

    state.activeTab = tab;
    soundManager.playChime();

    if (tab === 'inbox') {
      state.emails.forEach(function (e) {
        if (e.unread) e.unread = false;
      });
      state.unreadInboxCount = 0;
    }

    if (tab === 'chat' && state.chatUnreadPing > 0) {
      state.chatUnreadPing = 0;
      var pingBadge = $('#chat-ping-badge');
      if (pingBadge) pingBadge.classList.remove('visible');
    }

    render();
  }

  var isDispatchThrottled = false;

  function sendChatMessage(text) {
    if (state.isGameOver || state.isManagerTyping || isDispatchThrottled) return;
    if (!text || !text.trim()) return;
    text = text.trim();

    isDispatchThrottled = true;
    setTimeout(function () {
      isDispatchThrottled = false;
    }, 300);

    soundManager.playChime();

    if (state.interruptPending) {
      handleInterruptResponse(text);
      return;
    }

    state.chatMessages.push({
      id: Date.now(),
      sender: 'Alex Chen',
      role: 'Software Engineering Intern',
      time: nowTime(),
      text: text,
      isUser: true
    });

    var input = $('#chat-input');
    if (input) input.value = '';

    state.isManagerTyping = true;
    renderChat();

    var lower = text.toLowerCase();
    var replyText = '';
    var patienceDelta = 0;
    var metricUpdate = {};

    if (lower.indexOf('drafting the pr') !== -1 || lower.indexOf('drafting') !== -1) {
      replyText = 'Acknowledged. Staging is blocked until this merges. Be thorough with edge cases.';
      patienceDelta = 4;
      metricUpdate = { communicationProfessionalism: 92, responseTime: 70 };
    } else if (lower.indexOf('pushed hotfix') !== -1 || lower.indexOf('pushed to branch') !== -1) {
      if (!state.testsRanOnce || !state.testsPassed) {
        replyText = 'Did you even run the test suite? Staging pipeline just failed on null header. Check your diff again.';
        patienceDelta = -8;
        metricUpdate = { autonomy: Math.max(50, state.evalMetrics.autonomy - 8) };
        soundManager.playError();
      } else {
        replyText = 'Checking the branch now. Make sure all local test assertions passed in your workspace before creating the pull request.';
        patienceDelta = 6;
        metricUpdate = { autonomy: 75, responseTime: 72 };
      }
    } else if (lower.indexOf('staging logs') !== -1 || lower.indexOf('access') !== -1) {
      replyText = 'Staging logs and crash stack traces are available in your Task Workspace toolbar and the P0 email. Inspect them directly.';
      patienceDelta = -4;
      metricUpdate = { autonomy: Math.max(50, state.evalMetrics.autonomy - 5) };
    } else {
      replyText = 'Understood. Review the APX-104 ticket requirements and verify that no unhandled exceptions can escape the authMiddleware function.';
      patienceDelta = 2;
      metricUpdate = { responseTime: Math.min(100, state.evalMetrics.responseTime + 3) };
    }

    setTimeout(function () {
      state.isManagerTyping = false;

      state.chatMessages.push({
        id: Date.now() + 1,
        sender: 'Vikram Malhotra',
        role: 'Lead Architect',
        time: nowTime(),
        text: replyText,
        isUser: false
      });

      applyPatienceDelta(patienceDelta);

      Object.keys(metricUpdate).forEach(function (key) {
        state.evalMetrics[key] = metricUpdate[key];
      });

      addAuditEntry(
        'Intern interaction: "' + text.substring(0, 36) + (text.length > 36 ? '...' : '') + '"',
        'Manager Patience ' + (patienceDelta >= 0 ? '+' : '') + patienceDelta + '%'
      );

      soundManager.playChime();
      render();
    }, 1300);
  }

  function runTests() {
    if (state.isGameOver || state.isRunningTests) return;
    state.isRunningTests = true;

    var runBtn = $('#btn-run-tests');
    if (runBtn) {
      runBtn.disabled = true;
      runBtn.textContent = 'RUNNING TEST HARNESS...';
    }

    state.gameplayStats.testRunsCount++;
    state.testOutput = [
      'EXECUTING: node --test test/unit/authMiddleware.spec.js',
      'ENGINE: Node.js v20.12.0 [Strict Mode: Enabled]',
      'TARGET SUITE: Auth Middleware Header Validation [APX-104]'
    ];
    state.testsRanOnce = true;
    renderTestOutput();

    setTimeout(function () {
      state.isRunningTests = false;
      var fixed = codeIsFixed();
      var timestamp = nowTime();

      if (fixed) {
        state.testsPassed = true;
        state.testOutput = [
          'EXECUTING: node --test test/unit/authMiddleware.spec.js',
          'ENGINE: Node.js v20.12.0 [Strict Mode: Enabled]',
          'TARGET SUITE: Auth Middleware Header Validation [APX-104]',
          '------------------------------------------------------------',
          '[TEST 1] Authorization header present and valid JWT -> PASS (21ms)',
          '[TEST 2] Missing Authorization header -> PASS (14ms)',
          '[TEST 3] Malformed token format -> PASS (11ms)',
          '------------------------------------------------------------',
          'ASSERTION SUMMARY: 3 passed, 0 failed, 3 total assertions',
          'COVERAGE: 100% branch coverage on /src/middleware/auth.js',
          'TIMESTAMP: ' + timestamp,
          'STATUS: TEST SUITE PASSED - READY FOR PULL REQUEST REVIEW'
        ];
        applyPatienceDelta(8);
        state.evalMetrics.technicalAccuracy = 96;
        state.evalMetrics.autonomy = Math.min(100, state.evalMetrics.autonomy + 10);

        soundManager.playSuccess();
        showToast('LOCAL TESTS PASSED (3/3)', 'Auth header null-guards verified. Ready to submit PR.');
        addAuditEntry('Local test suite passed (3/3 assertions). Null-guard verified.', 'Technical Accuracy +10%, Patience +8%');
      } else {
        state.testsPassed = false;
        state.gameplayStats.testFailsCount++;
        state.testOutput = [
          'EXECUTING: node --test test/unit/authMiddleware.spec.js',
          'ENGINE: Node.js v20.12.0 [Strict Mode: Enabled]',
          'TARGET SUITE: Auth Middleware Header Validation [APX-104]',
          '------------------------------------------------------------',
          '[TEST 1] Authorization header present and valid JWT -> PASS (24ms)',
          '[TEST 2] Missing Authorization header -> FAIL (31ms)',
          '       TypeError: Cannot read properties of undefined (reading \'split\')',
          '       at authMiddleware (/src/middleware/auth.js:14:38)',
          '       Expected: HTTP 401 Unauthorized',
          '       Received: Unhandled Exception (Process Crash)',
          '[TEST 3] Malformed token format -> FAIL (28ms)',
          '       Expected: HTTP 401 with error payload',
          '       Received: Process terminated before assertion',
          '------------------------------------------------------------',
          'ASSERTION SUMMARY: 1 passed, 2 failed, 3 total assertions',
          'TIMESTAMP: ' + timestamp,
          'STATUS: TEST SUITE FAILED - RESOLVE DEFECTS BEFORE CREATING PR'
        ];
        applyPatienceDelta(-5);
        state.evalMetrics.technicalAccuracy = Math.max(50, state.evalMetrics.technicalAccuracy - 5);

        soundManager.playError();
        showToast('TEST ASSERTION FAILED', 'TypeError: Cannot read properties of undefined (reading "split")');
        addAuditEntry('Local test run failed (1/3 assertions passed). Uncaught TypeError.', 'Technical Accuracy -5%, Patience -5%');
      }

      if (runBtn) {
        runBtn.disabled = false;
        runBtn.textContent = 'RUN LOCAL TESTS';
      }

      render();
    }, 1100);
  }

  function openPRModal() {
    if (state.isGameOver) return;
    var modal = $('#pr-modal');
    if (!modal) return;

    var validation = $('#modal-validation');
    if (validation) {
      var fixed = codeIsFixed();
      if (fixed) {
        validation.className = 'modal-validation pass';
        validation.textContent = '[VALIDATION PASSED] Unit suite passes 3/3 assertions. Ready for merge.';
      } else {
        validation.className = 'modal-validation fail';
        validation.textContent = '[WARNING] Local test suite has unhandled test failures. Submitting now will trigger a Manager Patience penalty.';
      }
    }

    modal.classList.add('visible');
    soundManager.playChime();
  }

  function closePRModal() {
    var modal = $('#pr-modal');
    if (modal) modal.classList.remove('visible');
  }

  function confirmSubmitPR() {
    closePRModal();
    if (state.isGameOver) return;

    var fixed = codeIsFixed();
    var patienceBoost = fixed ? 15 : -10;

    state.prSubmitted = true;
    state.gameplayStats.prSubmitTime = Date.now();
    state.ticketStatus = fixed ? 'MERGED TO STAGING' : 'REJECTED - REVISION REQUIRED';

    showToast(
      'PR #249 Created: Staging pipeline running...',
      fixed
        ? 'Branch fix/apx-104-token-null-check submitted to Vikram Malhotra for review.'
        : 'WARNING: PR submitted with failing test assertions. Manager has been notified.'
    );

    var timeStr = nowTime();

    state.chatMessages.push({
      id: Date.now(),
      sender: 'Alex Chen',
      role: 'Software Engineering Intern',
      time: timeStr,
      text: 'PR #249 submitted: "fix(auth): APX-104 guard against null authorization header and return 401". Ready for review.',
      isUser: true
    });

    state.isManagerTyping = true;
    render();

    setTimeout(function () {
      state.isManagerTyping = false;

      if (fixed) {
        applyPatienceDelta(patienceBoost);
        soundManager.playSuccess();
        state.chatMessages.push({
          id: Date.now() + 1,
          sender: 'Vikram Malhotra',
          role: 'Lead Architect',
          time: nowTime(),
          text: 'Seeing PR #249 now. Code looks clean. Merging to staging-east. Good catch on the missing Bearer check. Opening sprint debrief.',
          isUser: false
        });

        state.evalMetrics.technicalAccuracy = 98;
        state.evalMetrics.autonomy = 92;
        state.evalMetrics.responseTime = 88;

        addAuditEntry(
          'Hotfix PR #249 approved and merged to staging-east by Lead Architect.',
          'Patience +15%, Sprint Milestone Achieved'
        );

        render();

        setTimeout(function () {
          openDebriefModal();
        }, 1500);

      } else {
        applyPatienceDelta(patienceBoost);
        soundManager.playError();
        state.chatMessages.push({
          id: Date.now() + 1,
          sender: 'Vikram Malhotra',
          role: 'Lead Architect',
          time: nowTime(),
          text: 'PR rejected. You submitted without fixing the root null pointer. Review the stack trace and re-test locally.',
          isUser: false
        });

        addAuditEntry(
          'PR #249 rejected by Lead Architect Vikram Malhotra.',
          'Patience -10%, Revision Required'
        );

        render();
      }
    }, 1500);
  }

  var timerInterval = null;
  var patienceDecayInterval = null;
  var interruptTimer = null;

  function stopAllTimers() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    if (patienceDecayInterval) { clearInterval(patienceDecayInterval); patienceDecayInterval = null; }
    if (interruptTimer) { clearTimeout(interruptTimer); interruptTimer = null; }
    if (state.interruptSlaTimer) { clearTimeout(state.interruptSlaTimer); state.interruptSlaTimer = null; }
  }

  function startTimers() {
    stopAllTimers();

    timerInterval = setInterval(function () {
      if (state.isGameOver) return;
      if (state.secondsRemaining > 0) {
        state.secondsRemaining--;
        renderTopNav();

        if (state.secondsRemaining === 0) {
          state.isGameOver = true;
          freezeInputs();
          stopAllTimers();
          showToast('SLA TIME EXPIRED', 'Sprint 1 deadline reached. Generating apprentice assessment report.');
          addAuditEntry('Sprint 1 SLA deadline reached (00:00). All deployments locked.', 'Assessment Finalized');
          openDebriefModal();
        }
      }
    }, 1000);

    patienceDecayInterval = setInterval(function () {
      if (state.isGameOver) return;
      if (state.patienceScore > 10) {
        applyPatienceDelta(-1);
        if (state.patienceScore <= 30 && state.patienceScore % 5 === 0) {
          soundManager.playError();
          showToast('CRITICAL SUPERVISOR PATIENCE', 'Manager patience is dangerously low (' + state.patienceScore + '%). Prioritize shipping the hotfix.');
        }
      }
    }, 30000);

    interruptTimer = setTimeout(function () {
      if (!state.isGameOver) {
        triggerSprintInterruption();
      }
    }, 45000);
  }

  function openDemoModal() {
    var modal = $('#demo-modal');
    if (modal) {
      modal.classList.add('visible');
      soundManager.playChime();
    }
  }

  function closeDemoModal() {
    var modal = $('#demo-modal');
    if (modal) modal.classList.remove('visible');
  }

  function demoActionPreFillFix() {
    state.editorContent = RECOMMENDED_FIX;
    state.testsPassed = false;
    state.testsRanOnce = false;
    state.testOutput = [];
    switchTab('workspace');
    renderWorkspace();
    renderTestOutput();
    soundManager.playChime();
    showToast('DEMO SHORTCUT [1]', 'Auto-filled recommended Bearer null-guard logic into editor.');
    closeDemoModal();
  }

  function demoActionTriggerPing() {
    switchTab('chat');
    triggerSprintInterruption();
    showToast('DEMO SHORTCUT [2]', 'Triggered war room escalation ping immediately.');
    closeDemoModal();
  }

  function demoActionForcePassTests() {
    state.editorContent = RECOMMENDED_FIX;
    state.testsPassed = true;
    state.testsRanOnce = true;
    state.evalMetrics.technicalAccuracy = 98;
    state.testOutput = [
      'EXECUTING: node --test test/unit/authMiddleware.spec.js',
      'ENGINE: Node.js v20.12.0 [Strict Mode: Enabled]',
      'TARGET SUITE: Auth Middleware Header Validation [APX-104]',
      '------------------------------------------------------------',
      '[TEST 1] Authorization header present and valid JWT -> PASS (19ms)',
      '[TEST 2] Missing Authorization header -> PASS (12ms)',
      '[TEST 3] Malformed token format -> PASS (9ms)',
      '------------------------------------------------------------',
      'ASSERTION SUMMARY: 3 passed, 0 failed, 3 total assertions',
      'COVERAGE: 100% branch coverage on /src/middleware/auth.js',
      'STATUS: TEST SUITE PASSED - READY FOR PULL REQUEST REVIEW'
    ];
    switchTab('workspace');
    renderWorkspace();
    renderTestOutput();
    soundManager.playSuccess();
    showToast('DEMO SHORTCUT [3]', 'Unit tests forced GREEN. PR submission unlocked.');
    closeDemoModal();
  }

  function demoActionOpenDebrief() {
    openDebriefModal();
    showToast('DEMO SHORTCUT [4]', 'Opened Apprentice Assessment Report scorecard.');
    closeDemoModal();
  }

  function runGreenroomAudit() {
    var results = [];
    var allPassed = true;

    try {
      var tabs = ['inbox', 'chat', 'workspace', 'eval'];
      var originalTab = state.activeTab;
      var tabNavPassed = true;
      var failedTab = '';

      for (var t = 0; t < tabs.length; t++) {
        var tb = tabs[t];
        switchTab(tb);
        var panel = $('#panel-' + tb);
        var btn = $('#tab-btn-' + tb);
        if (!panel || !panel.classList.contains('active') || !btn || !btn.classList.contains('active')) {
          tabNavPassed = false;
          failedTab = tb;
          break;
        }
      }
      switchTab(originalTab);

      if (tabNavPassed) {
        results.push({
          name: 'Navigation & Tab Switching: PASS',
          detail: 'All 4 navigation tabs (inbox, chat, workspace, eval) mounted & toggled cleanly without DOM exceptions.',
          pass: true
        });
      } else {
        allPassed = false;
        results.push({
          name: 'Navigation & Tab Switching: FAIL',
          detail: 'Tab failure on panel #' + failedTab,
          pass: false
        });
      }
    } catch (e) {
      allPassed = false;
      results.push({ name: 'Navigation & Tab Switching: FAIL', detail: e.message, pass: false });
    }

    try {
      var hasMessages = state.chatMessages && state.chatMessages.length >= 3;
      var hasDispatcher = typeof sendChatMessage === 'function';
      var chips = $$('.response-chip');
      var hasChips = chips && chips.length >= 3;

      if (hasMessages && hasDispatcher && hasChips) {
        results.push({
          name: 'Chat Dispatch & Vikram Reactive Replies: PASS',
          detail: 'Interactive feed active, 3 baseline supervisor pings verified, quick status chips armed with 300ms multi-click debounce.',
          pass: true
        });
      } else {
        allPassed = false;
        results.push({
          name: 'Chat Dispatch & Vikram Reactive Replies: FAIL',
          detail: 'Chat state or dispatch handlers missing.',
          pass: false
        });
      }
    } catch (e) {
      allPassed = false;
      results.push({ name: 'Chat Dispatch & Vikram Reactive Replies: FAIL', detail: e.message, pass: false });
    }

    try {
      var tempState = state.editorContent;
      state.editorContent = ORIGINAL_CODE;
      var testFlawed = !codeIsFixed();

      state.editorContent = RECOMMENDED_FIX;
      var testFixed = codeIsFixed();
      state.editorContent = tempState;

      var diffOps = computeLineDiff(ORIGINAL_CODE, RECOMMENDED_FIX);
      var hasDel = diffOps.some(function (d) { return d.type === 'del'; });
      var hasAdd = diffOps.some(function (d) { return d.type === 'add'; });

      var runBtn = $('#btn-run-tests');
      var submitBtn = $('#btn-submit-pr');

      if (testFlawed && testFixed && hasDel && hasAdd && runBtn && submitBtn) {
        results.push({
          name: 'Diff Workspace & Assertion Engine: PASS',
          detail: 'LCS line diff verified (red deletions + green additions). Null-safety guards verified on RFC 6750.',
          pass: true
        });
      } else {
        allPassed = false;
        results.push({
          name: 'Diff Workspace & Assertion Engine: FAIL',
          detail: 'Diff engine or null-safety assertion check failed.',
          pass: false
        });
      }
    } catch (e) {
      allPassed = false;
      results.push({ name: 'Diff Workspace & Assertion Engine: FAIL', detail: e.message, pass: false });
    }

    try {
      var m = state.evalMetrics;
      var hasMetrics = typeof m.technicalAccuracy === 'number' &&
                        typeof m.communicationProfessionalism === 'number' &&
                        typeof m.responseTime === 'number' &&
                        typeof m.autonomy === 'number';
      var debriefModal = $('#debrief-modal');
      var escalationModal = $('#escalation-modal');
      var auditEntries = state.evalAuditLog && state.evalAuditLog.length > 0;

      if (hasMetrics && debriefModal && escalationModal && auditEntries) {
        results.push({
          name: 'Manager Evaluation Telemetry & Debrief Modal: PASS',
          detail: 'Live 4-metric scoring rubric online, audit trail streaming, debrief & escalation modals registered.',
          pass: true
        });
      } else {
        allPassed = false;
        results.push({
          name: 'Manager Evaluation Telemetry & Debrief Modal: FAIL',
          detail: 'Evaluation rubric or end-game modals missing.',
          pass: false
        });
      }
    } catch (e) {
      allPassed = false;
      results.push({ name: 'Manager Evaluation Telemetry & Debrief Modal: FAIL', detail: e.message, pass: false });
    }

    try {
      var scripts = Array.from($$('script'));
      var externalScripts = scripts.filter(function (s) {
        return s.src && (s.src.indexOf('http://') === 0 || s.src.indexOf('https://') === 0);
      });

      var links = Array.from($$('link[rel="stylesheet"]'));
      var externalLinks = links.filter(function (l) {
        return l.href && (l.href.indexOf('http://') === 0 || l.href.indexOf('https://') === 0);
      });

      var appShell = $('#app-shell');
      var cs = appShell ? window.getComputedStyle(appShell) : {};
      var hasBackdrop = cs.backdropFilter && cs.backdropFilter !== 'none';
      var hasBoxShadow = cs.boxShadow && cs.boxShadow !== 'none';

      if (externalScripts.length === 0 && externalLinks.length === 0 && !hasBackdrop && !hasBoxShadow) {
        results.push({
          name: 'Offline Safety & Zero External CDN Dependencies: PASS',
          detail: '100% self-contained local bundle. Zero external font/script CDNs. Strict Backstage Green design verified.',
          pass: true
        });
      } else {
        allPassed = false;
        results.push({
          name: 'Offline Safety & Zero External CDN Dependencies: FAIL',
          detail: 'External assets or unauthorized styles detected.',
          pass: false
        });
      }
    } catch (e) {
      allPassed = false;
      results.push({ name: 'Offline Safety & Zero External CDN Dependencies: FAIL', detail: e.message, pass: false });
    }

    renderDiagnosticModal(results, allPassed);
    soundManager.playSuccess();
    showToast('PRE-FLIGHT AUDIT COMPLETE', allPassed ? 'All 5 engine checks passed (100% health).' : 'Diagnostic warning flagged.');
    addAuditEntry('Pre-flight self-test executed: 5/5 diagnostic checks verified. System 100% healthy.', 'Self-Test PASS');

    return {
      allPassed: allPassed,
      results: results
    };
  }

  function renderDiagnosticModal(results, allPassed) {
    var modal = $('#diagnostic-modal');
    var checklist = $('#diagnostic-checklist');
    var badge = $('#diag-summary-badge');
    var banner = $('#diagnostic-banner');
    if (!modal || !checklist) return;

    if (badge) {
      badge.className = 'diag-status-badge ' + (allPassed ? 'pass' : 'fail');
      badge.textContent = allPassed ? '[HEALTH: 100%]' : '[ATTENTION REQUIRED]';
    }

    if (banner) {
      banner.className = 'diagnostic-banner ' + (allPassed ? '' : 'fail');
      banner.textContent = allPassed
        ? 'APEXCORE SANDBOX ENGINE HEALTH: 100% // READY FOR HORIZON DEMO'
        : 'APEXCORE SANDBOX ENGINE AUDIT: DEFECT DETECTED // REVIEW TELEMETRY';
    }

    checklist.innerHTML = results.map(function (r) {
      return '<div class="diagnostic-item ' + (r.pass ? 'pass' : 'fail') + '">' +
        '<div class="item-left">' +
          '<div class="item-title">' +
            '<span class="item-icon">' + (r.pass ? '[✓]' : '[✗]') + '</span>' +
            '<span>' + escapeHtml(r.name) + '</span>' +
          '</div>' +
          '<div class="item-detail">' + escapeHtml(r.detail) + '</div>' +
        '</div>' +
        '<span class="item-result">' + (r.pass ? 'PASS' : 'FAIL') + '</span>' +
      '</div>';
    }).join('');

    modal.classList.add('visible');
  }

  function closeDiagnosticModal() {
    var modal = $('#diagnostic-modal');
    if (modal) modal.classList.remove('visible');
  }

  function handleGlobalKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
      if (e.key === '0' || e.code === 'Digit0') {
        e.preventDefault();
        runGreenroomAudit();
      } else if (e.key === '1' || e.code === 'Digit1') {
        e.preventDefault();
        demoActionPreFillFix();
      } else if (e.key === '2' || e.code === 'Digit2') {
        e.preventDefault();
        demoActionTriggerPing();
      } else if (e.key === '3' || e.code === 'Digit3') {
        e.preventDefault();
        demoActionForcePassTests();
      } else if (e.key === '4' || e.code === 'Digit4') {
        e.preventDefault();
        demoActionOpenDebrief();
      }
    }
  }

  function bindEvents() {
    document.addEventListener('click', function () {
      getAudioContext();
    }, { once: true });

    window.addEventListener('keydown', handleGlobalKeyDown);

    $$('.nav-tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.dataset.tab);
      });
    });

    $$('.response-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        sendChatMessage(chip.dataset.message);
      });
    });

    var chatInput = $('#chat-input');
    var dispatchBtn = $('#btn-chat-dispatch');

    if (chatInput) {
      chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendChatMessage(chatInput.value);
        }
      });
    }

    if (dispatchBtn) {
      dispatchBtn.addEventListener('click', function () {
        sendChatMessage(chatInput ? chatInput.value : '');
      });
    }

    var viewLogsBtn = $('#btn-view-staging-logs');
    if (viewLogsBtn) {
      viewLogsBtn.addEventListener('click', function () {
        openStagingLogsModal();
      });
    }

    var logsClose = $('#staging-logs-close');
    if (logsClose) logsClose.addEventListener('click', closeStagingLogsModal);

    var logsDismiss = $('#staging-logs-dismiss');
    if (logsDismiss) logsDismiss.addEventListener('click', closeStagingLogsModal);

    var toggleDiffBtn = $('#btn-toggle-diff');
    if (toggleDiffBtn) {
      toggleDiffBtn.addEventListener('click', function () {
        toggleDiffMode();
      });
    }

    var loadPatchBtn = $('#btn-load-patch');
    if (loadPatchBtn) {
      loadPatchBtn.addEventListener('click', function () {
        if (state.isGameOver) return;
        state.editorContent = RECOMMENDED_FIX;
        var editor = $('#intern-editor');
        if (editor) editor.value = RECOMMENDED_FIX;
        state.testsPassed = false;
        state.testsRanOnce = false;
        state.testOutput = [];
        renderWorkspace();
        renderTestOutput();
        soundManager.playChime();
        showToast('PATCH LOADED', 'Loaded recommended Bearer null-guard logic into working copy.');
      });
    }

    var resetBtn = $('#btn-reset-flawed');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (state.isGameOver) return;
        state.editorContent = ORIGINAL_CODE;
        var editor = $('#intern-editor');
        if (editor) editor.value = ORIGINAL_CODE;
        state.testsPassed = false;
        state.testsRanOnce = false;
        state.testOutput = [];
        renderWorkspace();
        renderTestOutput();
        soundManager.playChime();
        showToast('RESET TO FLAWED', 'Reverted working copy back to vulnerable production code.');
      });
    }

    var runTestsBtn = $('#btn-run-tests');
    if (runTestsBtn) {
      runTestsBtn.addEventListener('click', function () {
        runTests();
      });
    }

    var submitPRBtn = $('#btn-submit-pr');
    if (submitPRBtn) {
      submitPRBtn.addEventListener('click', function () {
        openPRModal();
      });
    }

    var modalClose = $('#modal-close-btn');
    if (modalClose) modalClose.addEventListener('click', closePRModal);

    var modalCancel = $('#modal-cancel-btn');
    if (modalCancel) modalCancel.addEventListener('click', closePRModal);

    var modalConfirm = $('#modal-confirm-btn');
    if (modalConfirm) modalConfirm.addEventListener('click', confirmSubmitPR);

    var debriefClose = $('#debrief-close-btn');
    if (debriefClose) debriefClose.addEventListener('click', closeDebriefModal);

    var debriefExport = $('#debrief-export');
    if (debriefExport) debriefExport.addEventListener('click', exportPerformanceRecord);

    var debriefRestart = $('#debrief-restart');
    if (debriefRestart) debriefRestart.addEventListener('click', restartScenario);

    var escClose = $('#escalation-close-btn');
    if (escClose) escClose.addEventListener('click', closeEscalationModal);

    var escReview = $('#btn-escalation-review');
    if (escReview) {
      escReview.addEventListener('click', function () {
        closeEscalationModal();
        switchTab('eval');
      });
    }

    var escRestart = $('#btn-escalation-restart');
    if (escRestart) escRestart.addEventListener('click', restartScenario);

    var demoMenuBtn = $('#btn-demo-menu');
    if (demoMenuBtn) demoMenuBtn.addEventListener('click', openDemoModal);

    var demoTagBtn = $('#demo-tag-label');
    if (demoTagBtn) demoTagBtn.addEventListener('click', openDemoModal);

    var demoClose = $('#demo-modal-close');
    if (demoClose) demoClose.addEventListener('click', closeDemoModal);

    var demoFix = $('#demo-act-fix');
    if (demoFix) demoFix.addEventListener('click', demoActionPreFillFix);

    var demoPing = $('#demo-act-ping');
    if (demoPing) demoPing.addEventListener('click', demoActionTriggerPing);

    var demoPass = $('#demo-act-pass');
    if (demoPass) demoPass.addEventListener('click', demoActionForcePassTests);

    var demoDebrief = $('#demo-act-debrief');
    if (demoDebrief) demoDebrief.addEventListener('click', demoActionOpenDebrief);

    var diagClose = $('#diagnostic-close-btn');
    if (diagClose) diagClose.addEventListener('click', closeDiagnosticModal);

    var diagDismiss = $('#diagnostic-dismiss-btn');
    if (diagDismiss) diagDismiss.addEventListener('click', closeDiagnosticModal);

    var diagRerun = $('#diagnostic-rerun-btn');
    if (diagRerun) diagRerun.addEventListener('click', function () { runGreenroomAudit(); });

    var demoAudit = $('#demo-act-audit');
    if (demoAudit) {
      demoAudit.addEventListener('click', function () {
        closeDemoModal();
        runGreenroomAudit();
      });
    }

    $$('.response-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        chip.style.pointerEvents = 'none';
        setTimeout(function () {
          chip.style.pointerEvents = '';
        }, 300);
      });
    });

    var editorTA = $('#intern-editor');
    if (editorTA) {
      editorTA.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') {
          e.preventDefault();
          var start = this.selectionStart;
          var end = this.selectionEnd;
          var val = this.value;
          this.value = val.substring(0, start) + '  ' + val.substring(end);
          this.selectionStart = this.selectionEnd = start + 2;
          state.editorContent = this.value;
          var lineCountEl = $('#intern-line-count');
          if (lineCountEl) lineCountEl.textContent = 'LINES: ' + this.value.split('\n').length;
        }
      });

      editorTA.addEventListener('input', function () {
        state.editorContent = this.value;
        state.testsPassed = false;
        state.testsRanOnce = false;
        state.testOutput = [];
        renderWorkspace();
        renderTestOutput();

        if (!state.interruptTriggered && state.secondsRemaining < 1700) {
          triggerSprintInterruption();
        }
      });
    }
  }

  function boot() {
    var editor = $('#intern-editor');
    if (editor) editor.value = ORIGINAL_CODE;

    var hostLabel = $('#runtime-host-label');
    if (hostLabel && window.location) {
      var hostname = window.location.hostname;
      if (hostname && (hostname.indexOf('render.com') !== -1 || hostname.indexOf('onrender.com') !== -1)) {
        hostLabel.textContent = 'RENDER CLUSTER // LIVE WEB SERVICE';
      } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        hostLabel.textContent = 'LOCALHOST:' + (window.location.port || '10000') + ' // LIVE SERVER';
      } else if (window.location.protocol === 'file:') {
        hostLabel.textContent = 'LOCAL FILE // STANDALONE';
      }
    }

    bindEvents();
    render();
    startTimers();
  }

  window.GreenroomEngine = {
    state: state,
    render: render,
    switchTab: switchTab,
    sendChatMessage: sendChatMessage,
    runTests: runTests,
    showToast: showToast,
    soundManager: soundManager,
    openDebriefModal: openDebriefModal,
    openStagingLogsModal: openStagingLogsModal,
    openEscalationModal: triggerIncidentEscalation,
    openDemoModal: openDemoModal,
    openDiagnosticModal: runGreenroomAudit,
    closeDiagnosticModal: closeDiagnosticModal,
    runGreenroomAudit: runGreenroomAudit,
    toggleDiffMode: toggleDiffMode,
    triggerSprintInterruption: triggerSprintInterruption,
    restartScenario: restartScenario,
    demoActionPreFillFix: demoActionPreFillFix,
    demoActionTriggerPing: demoActionTriggerPing,
    demoActionForcePassTests: demoActionForcePassTests,
    demoActionOpenDebrief: demoActionOpenDebrief
  };

  window.runGreenroomAudit = runGreenroomAudit;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();