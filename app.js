var WEBHOOK_URL = 'https://n8n.myaibuffet.com/webhook/resume-tailor';
var uploadedFile = null;
var promoApplied = false;

function applyPromo() {
    var input = document.getElementById('promoCode');
    var msg = document.getElementById('promoMsg');
    var code = input.value.trim();
    if (code === 'test123') {
        promoApplied = true;
        msg.textContent = 'Promo applied. Free generation.';
        msg.className = 'promo-msg success';
        input.disabled = true;
        document.getElementById('promoBtn').disabled = true;
        document.getElementById('btnPrice').textContent = 'Free';
    } else {
        msg.textContent = 'Invalid promo code.';
        msg.className = 'promo-msg error';
        promoApplied = false;
    }
}

var resumeMode = 'upload';

function switchResumeTab(tab) {
    resumeMode = tab;
    document.querySelectorAll('.ri-tab').forEach(function(b) { b.classList.remove('active'); });
    document.querySelector('[data-tab="' + tab + '"]').classList.add('active');
    document.getElementById('resumeUploadTab').style.display = tab === 'upload' ? 'block' : 'none';
    document.getElementById('resumePasteTab').style.display = tab === 'paste' ? 'block' : 'none';
}

// Mobile menu
var mobileToggle = document.getElementById('mobileToggle');
if (mobileToggle) {
    mobileToggle.addEventListener('click', function() {
        document.getElementById('navLinks').classList.toggle('open');
    });
}

// Job posting URL detection
var jobText = document.getElementById('jobText');
var jobHint = document.getElementById('jobHint');
if (jobText) {
    jobText.addEventListener('input', function() {
        var val = this.value.trim();
        if (val.match(/^https?:\/\//i) && val.length < 200) {
            jobHint.textContent = 'Tip: pasting the full job description text gives better results than a URL.';
        } else {
            jobHint.textContent = '';
        }
    });
}

// Price toggle
var coverCheck = document.getElementById('coverLetter');
var totalEl = document.getElementById('btnPrice');
if (coverCheck) {
    coverCheck.addEventListener('change', function() {
        totalEl.textContent = this.checked ? '$1.50' : '$1.00';
    });
}

// File upload
var uploadZone = document.getElementById('uploadZone');
var fileInput = document.getElementById('fileInput');
var uploadDefault = document.getElementById('uploadDefault');
var uploadDone = document.getElementById('uploadDone');
var fileNameEl = document.getElementById('fileName');
var removeBtn = document.getElementById('removeFile');

if (uploadZone) {
    uploadZone.addEventListener('click', function() {
        if (!uploadedFile) fileInput.click();
    });

    uploadZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', function() {
        this.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', function() {
        if (this.files.length) handleFile(this.files[0]);
    });

    removeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        uploadedFile = null;
        fileInput.value = '';
        uploadDefault.style.display = 'block';
        uploadDone.style.display = 'none';
        uploadZone.classList.remove('has-file', 'file-error');
    });
}

function handleFile(file) {
    var validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (validTypes.indexOf(file.type) === -1 && !file.name.match(/\.(pdf|doc|docx)$/i)) {
        uploadZone.classList.add('file-error');
        uploadDefault.innerHTML = '<p style="color:var(--red);font-weight:600;">Please upload a PDF or Word document</p><p class="upload-hint">PDF or Word, 5MB max</p>';
        setTimeout(function() {
            uploadZone.classList.remove('file-error');
            uploadDefault.innerHTML = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg><p class="upload-text">Drop your resume here or <span class="upload-link">click to browse</span></p><p class="upload-hint">PDF or Word, 5MB max</p>';
        }, 3000);
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        alert('File is too large. Maximum 5MB.');
        return;
    }
    uploadedFile = file;
    fileNameEl.textContent = file.name;
    uploadDefault.style.display = 'none';
    uploadDone.style.display = 'flex';
    uploadZone.classList.add('has-file');
}

// Form submit
var form = document.getElementById('resumeForm');
if (form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        var job = document.getElementById('jobText').value.trim();
        if (!job || job.length < 50) {
            alert('Please paste the full job description (at least 50 characters).');
            return;
        }
        var wantCover = document.getElementById('coverLetter').checked;
        var btn = document.getElementById('submitBtn');

        if (resumeMode === 'paste') {
            var resumeTextVal = document.getElementById('resumeText').value.trim();
            if (!resumeTextVal || resumeTextVal.length < 100) {
                alert('Please paste your full resume text (at least 100 characters).');
                return;
            }
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span>Tailoring your resume...';
            sendPayload({ resume: resumeTextVal, job_posting: job, include_cover_letter: wantCover }, btn);
        } else {
            if (!uploadedFile) {
                uploadZone.classList.add('file-error');
                setTimeout(function() { uploadZone.classList.remove('file-error'); }, 2000);
                return;
            }
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span>Reading your resume...';
            extractTextFromFile(uploadedFile).then(function(text) {
                if (!text || text.length < 50) {
                    alert('Could not extract enough text from your file (' + (text ? text.length : 0) + ' characters found). Please use the "Paste Text" tab and paste your resume manually.');
                    resetBtn(btn);
                    return;
                }
                btn.innerHTML = '<span class="spinner"></span>Tailoring your resume...';
                sendPayload({ resume: text, job_posting: job, include_cover_letter: wantCover }, btn);
            }).catch(function(err) {
                console.error('File extraction error:', err);
                alert('Could not read your file: ' + (err && err.message ? err.message : 'unknown error') + '. Please use the "Paste Text" tab instead.');
                resetBtn(btn);
            });
        }
    });
}

function extractTextFromFile(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onerror = function() { reject(new Error('Could not read file')); };
        reader.onload = function() {
            var arrayBuffer = reader.result;

            if (file.name.match(/\.pdf$/i)) {
                if (window.pdfjsLib) {
                    try {
                        var loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
                        loadingTask.promise.then(function(pdf) {
                            var pages = [];
                            var done = 0;
                            var total = pdf.numPages;
                            if (total === 0) { reject(new Error('PDF has no pages')); return; }
                            for (var i = 1; i <= total; i++) {
                                (function(pageNum) {
                                    pdf.getPage(pageNum).then(function(page) {
                                        page.getTextContent().then(function(content) {
                                            var text = content.items.map(function(item) { return item.str; }).join(' ');
                                            pages[pageNum - 1] = text;
                                            done++;
                                            if (done === total) {
                                                var result = pages.join('\n\n').trim();
                                                if (result.length > 50) resolve(result);
                                                else reject(new Error('PDF appears to be scanned/image-based. Please use Paste Text tab.'));
                                            }
                                        }).catch(function() { done++; pages[pageNum-1] = ''; if (done === total) resolve(pages.join('\n\n').trim()); });
                                    }).catch(function() { done++; pages[pageNum-1] = ''; if (done === total) resolve(pages.join('\n\n').trim()); });
                                })(i);
                            }
                        }).catch(function(e) { reject(new Error('Could not parse PDF: ' + (e.message || e))); });
                    } catch(e) { reject(new Error('PDF parser error: ' + e.message)); }
                } else {
                    reject(new Error('PDF reader not loaded. Try refreshing the page, or use the Paste Text tab.'));
                }
            } else if (file.name.match(/\.docx$/i)) {
                if (window.mammoth) {
                    mammoth.extractRawText({ arrayBuffer: arrayBuffer }).then(function(result) {
                        var text = (result.value || '').trim();
                        if (text.length > 50) resolve(text);
                        else reject(new Error('Could not extract text from Word document'));
                    }).catch(function(e) { reject(new Error('Word parser error: ' + (e.message || e))); });
                } else {
                    reject(new Error('Word reader not loaded. Try refreshing the page, or use the Paste Text tab.'));
                }
            } else if (file.name.match(/\.doc$/i)) {
                reject(new Error('.doc format is not supported. Please save as .docx or PDF, or use the Paste Text tab.'));
            } else {
                reject(new Error('Unsupported file type. Please upload a PDF or .docx file.'));
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

function sendPayload(data, btn) {
    data.mode = promoApplied ? 'tailor_free' : 'tailor';
    data.amount = data.include_cover_letter ? 150 : 100;
    if (promoApplied) data.promo_code = 'test123';

    fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(function(r) { return r.json(); })
    .then(function(resp) {
        if (resp.payment_url) {
            window.location.href = resp.payment_url;
        } else if (resp.resume_text) {
            showResult(resp);
        } else if (resp.error) {
            alert(resp.error);
            resetBtn(btn);
        }
    })
    .catch(function() {
        alert('Something went wrong. Please try again.');
        resetBtn(btn);
    });
}

function resetBtn(btn) {
    btn.disabled = false;
    btn.innerHTML = 'Tailor My Resume <span class="btn-price" id="btnPrice">' + (document.getElementById('coverLetter').checked ? '$1.50' : '$1.00') + '</span>';
}

function showResult(data) {
    var area = document.getElementById('resultArea');
    var content = document.getElementById('resultContent');
    var btn = document.getElementById('submitBtn');

    var html = '<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.25rem;">';
    if (data.resume_pdf_base64) {
        html += '<a href="data:application/pdf;base64,' + data.resume_pdf_base64 + '" download="tailored_resume.pdf" class="btn">Download Resume PDF</a>';
    }
    if (data.cover_pdf_base64) {
        html += '<a href="data:application/pdf;base64,' + data.cover_pdf_base64 + '" download="cover_letter.pdf" class="btn" style="background:var(--green)">Download Cover Letter PDF</a>';
    }
    html += '</div>';

    if (data.resume_text) {
        html += '<div class="resume-preview">' + formatResumePreview(data.resume_text) + '</div>';
        html += '<button onclick="copyResume()" class="btn btn-sm" style="margin-top:.75rem;background:var(--bg-card);color:var(--text-mid);border:1px solid var(--border);" id="copyBtn">Copy Resume Text</button>';
    }
    if (data.cover_letter_text) {
        html += '<details style="margin-top:1.25rem;"><summary style="cursor:pointer;font-weight:600;font-size:.88rem;color:var(--text-mid);">View Cover Letter</summary>';
        html += '<div class="resume-preview" style="margin-top:.75rem;">' + formatResumePreview(data.cover_letter_text) + '</div></details>';
    }

    content.innerHTML = html;
    area.style.display = 'block';
    area.scrollIntoView({ behavior: 'smooth' });
    resetBtn(btn);

    window._resumeText = data.resume_text;
}

function formatResumePreview(text) {
    var lines = text.split('\n');
    var html = '';
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) { html += '<br>'; continue; }
        if (i === 0) { html += '<div style="text-align:center;font-size:1.1rem;font-weight:700;font-family:Georgia,serif;">' + escapeHtml(line) + '</div>'; continue; }
        if (i === 1 && (line.indexOf('|') !== -1 || line.indexOf('@') !== -1)) { html += '<div style="text-align:center;font-size:.75rem;color:#888;margin-bottom:.5rem;">' + escapeHtml(line) + '</div>'; continue; }
        if (line.match(/^(PROFESSIONAL SUMMARY|PROFESSIONAL EXPERIENCE|TECHNICAL SKILLS|EDUCATION|CERTIFICATIONS|SKILLS)/i)) {
            html += '<div style="font-size:.82rem;font-weight:700;border-bottom:1px solid #444;padding-bottom:2px;margin-top:.75rem;margin-bottom:.35rem;text-transform:uppercase;letter-spacing:.03em;">' + escapeHtml(line) + '</div>';
            continue;
        }
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        if (line.startsWith('* ') || line.startsWith('- ')) {
            html += '<div style="font-size:.78rem;margin-left:1rem;margin-bottom:.15rem;position:relative;padding-left:.75rem;color:#ccc;"><span style="position:absolute;left:0;">&#8226;</span>' + line.substring(2) + '</div>';
            continue;
        }
        if (line.match(/\|.*\d{4}/)) { html += '<div style="font-size:.75rem;color:#888;font-style:italic;">' + escapeHtml(line) + '</div>'; continue; }
        if (line.match(/^[A-Z]/) && lines[i+1] && lines[i+1].match(/[,|].*\d{4}/)) { html += '<div style="font-size:.85rem;font-weight:700;margin-top:.5rem;">' + escapeHtml(line) + '</div>'; continue; }
        html += '<div style="font-size:.78rem;color:#ccc;">' + line + '</div>';
    }
    return html;
}

function copyResume() {
    if (window._resumeText) {
        navigator.clipboard.writeText(window._resumeText).then(function() {
            var btn = document.getElementById('copyBtn');
            btn.textContent = 'Copied!';
            setTimeout(function() { btn.textContent = 'Copy Resume Text'; }, 2000);
        });
    }
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// FAQ toggle
function toggleFaq(btn) {
    var item = btn.parentElement;
    var wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(function(el) { el.classList.remove('open'); });
    if (!wasOpen) item.classList.add('open');
}

// Before/After rotation
var docExamples = [
    { name: 'MARIA GONZALEZ', contact: 'mariag88@yahoo.com | 469-555-0234',
      beforeSummary: 'I am a store manager looking for new opportunities. Good at customer service and managing people.',
      beforeJob: 'Store Manager', beforeCo: 'Dollar General, Mesquite TX', beforeDate: '2019 - Present',
      beforeBullets: ['Manage the store', 'Do scheduling for employees', 'Handle customer complaints', 'Count the register at night'],
      afterSummary: 'Retail operations manager with 5+ years overseeing daily store operations, P&L reporting, and team development for a high-volume location with ~$1.2M annual revenue.',
      afterJob: 'Store Manager', afterCo: 'Dollar General, Mesquite TX', afterDate: '2019 - Present',
      afterBullets: ['Managed daily operations for a <span class="dp-kw">high-volume retail location</span>, overseeing <span class="dp-kw">P&L reporting</span> and cash reconciliation', 'Recruited, trained, and <span class="dp-kw">developed a team</span> of ~10 associates, reducing turnover through structured onboarding', 'Resolved customer escalations and implemented service recovery processes, maintaining store satisfaction scores', 'Oversaw <span class="dp-kw">inventory management</span> and loss prevention, conducting nightly audits and variance reporting'],
      beforeScore: 23, afterScore: 87 },
    { name: 'JAMES CHEN', contact: 'jchen.dev@gmail.com | 972-555-3344 | github.com/jameschen',
      beforeSummary: 'Software developer with experience in multiple programming languages. Strong problem solver.',
      beforeJob: 'Software Developer', beforeCo: 'Acme Corp, Dallas TX', beforeDate: '2020 - Present',
      beforeBullets: ['Built web applications', 'Wrote APIs', 'Fixed bugs', 'Did code reviews'],
      afterSummary: 'Backend engineer with 4+ years building production web applications in Python and JavaScript. Experienced with RESTful APIs, PostgreSQL, and CI/CD pipelines in an Agile environment.',
      afterJob: 'Software Developer', afterCo: 'Acme Corp, Dallas TX', afterDate: '2020 - Present',
      afterBullets: ['Built and maintained <span class="dp-kw">React</span> web applications serving 50K+ monthly users with <span class="dp-kw">TypeScript</span> and modern frontend tooling', 'Designed <span class="dp-kw">RESTful APIs</span> in <span class="dp-kw">Node.js</span> with <span class="dp-kw">PostgreSQL</span>, handling 10K+ daily transactions across 3 microservices', 'Implemented <span class="dp-kw">CI/CD pipelines</span> using GitHub Actions, reducing deployment time from 2 hours to 15 minutes', 'Conducted <span class="dp-kw">code reviews</span> for a team of 6, reducing production bugs by ~30% quarter-over-quarter'],
      beforeScore: 31, afterScore: 92 },
    { name: 'TIFFANY NGUYEN', contact: 'tiffnguyen@gmail.com | 817-555-9012',
      beforeSummary: 'New nursing graduate looking for my first RN position. Completed clinical rotations at JPS Hospital.',
      beforeJob: 'Certified Nursing Assistant', beforeCo: 'Brookdale Senior Living, Arlington TX', beforeDate: 'Jun 2022 - May 2024',
      beforeBullets: ['Took vital signs', 'Helped patients with daily activities', 'Documented patient info'],
      afterSummary: 'BSN-prepared registered nurse with 2 years of CNA experience and 260 hours of clinical rotations across Med-Surg, ICU, OB, and Pediatrics units. BLS certified with hands-on patient assessment and documentation skills.',
      afterJob: 'Certified Nursing Assistant', afterCo: 'Brookdale Senior Living, Arlington TX', afterDate: 'Jun 2022 - May 2024',
      afterBullets: ['Monitored and recorded <span class="dp-kw">vital signs</span> for ~30 residents per shift, escalating changes to nursing staff per facility protocols', 'Delivered <span class="dp-kw">patient care</span> including bathing, mobility assistance, and meal support for a <span class="dp-kw">long-term care</span> population', 'Documented patient status and care activities in <span class="dp-kw">electronic health records</span>, maintaining accurate and timely charting'],
      beforeScore: 19, afterScore: 84 },
    { name: 'JOSE RAMIREZ', contact: 'jramirez77@gmail.com | 682-555-7788',
      beforeSummary: 'Construction worker with experience in framing, concrete, and drywall.',
      beforeJob: 'Construction Worker', beforeCo: 'Martinez Builders, Fort Worth TX', beforeDate: '2020 - Present',
      beforeBullets: ['General construction work', 'Framing and concrete', 'Operated power tools'],
      afterSummary: 'Construction professional with 5+ years of hands-on experience in commercial and residential projects. Skilled in concrete, framing, and finish work with OSHA 10 certification and bilingual English/Spanish communication.',
      afterJob: 'Construction Worker', afterCo: 'Martinez Builders, Fort Worth TX', afterDate: '2020 - Present',
      afterBullets: ['Executed <span class="dp-kw">framing</span>, <span class="dp-kw">concrete</span>, and <span class="dp-kw">drywall</span> installations across ~20 commercial and residential projects', 'Operated power tools and heavy equipment in compliance with <span class="dp-kw">OSHA safety regulations</span> with zero incidents', 'Read and interpreted <span class="dp-kw">construction drawings</span> to guide daily crew tasks and material staging', 'Trained 3 new crew members on site procedures, tool safety, and <span class="dp-kw">finish work</span> techniques'],
      beforeScore: 25, afterScore: 88 }
];

var docIdx = 0;
var docEl = document.getElementById('docCompare');
function renderDocCompare() {
    if (!docEl) return;
    var ex = docExamples[docIdx];
    function doc(summary, job, co, date, bullets, highlighted) {
        var cls = highlighted ? 'dp-strong' : 'dp-weak';
        var h = '<div class="dp-name">' + ex.name + '</div>';
        h += '<div class="dp-contact">' + ex.contact + '</div>';
        h += '<div class="dp-section">PROFESSIONAL SUMMARY</div>';
        h += '<div class="' + cls + '" style="font-size:.55rem;line-height:1.4;margin-bottom:.3rem;">' + summary + '</div>';
        h += '<div class="dp-section">PROFESSIONAL EXPERIENCE</div>';
        h += '<div class="dp-job"><strong>' + job + '</strong> | ' + co + '<br><em>' + date + '</em></div>';
        for (var i = 0; i < bullets.length; i++) {
            h += '<div class="dp-bullet">' + bullets[i] + '</div>';
        }
        return h;
    }
    docEl.innerHTML = '<div class="doc-col"><div class="doc-col-label">Before</div>'
        + '<div class="doc-preview">' + doc(ex.beforeSummary, ex.beforeJob, ex.beforeCo, ex.beforeDate, ex.beforeBullets, false) + '</div>'
        + '<div class="doc-score">' + ex.beforeScore + '% ATS match</div></div>'
        + '<div class="doc-col"><div class="doc-col-label">After ResumeGo</div>'
        + '<div class="doc-preview">' + doc(ex.afterSummary, ex.afterJob, ex.afterCo, ex.afterDate, ex.afterBullets, true) + '</div>'
        + '<div class="doc-score">' + ex.afterScore + '% ATS match</div></div>';
    docEl.style.opacity = '0';
    setTimeout(function() { docEl.style.opacity = '1'; }, 50);
}
renderDocCompare();
setInterval(function() { docIdx = (docIdx + 1) % docExamples.length; renderDocCompare(); }, 6000);

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.getElementById('navLinks').classList.remove('open');
        }
    });
});
