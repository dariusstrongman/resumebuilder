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
    } else if (data.resume_text) {
        html += '<button onclick="printResume()" class="btn">Download Resume PDF</button>';
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

function printResume() {
    if (!window._resumeText) return;
    var text = window._resumeText;
    var lines = text.split('\n');
    var html = '<html><head><style>body{margin:40px 55px;font-family:Georgia,serif;color:#1a1a1a;font-size:11px;line-height:1.45;}h1{text-align:center;font-size:20px;margin:0;letter-spacing:1px;}p.contact{text-align:center;font-size:9px;color:#333;margin:2px 0 8px;}h2{font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:1.5px solid #000;padding-bottom:2px;margin:12px 0 6px;}div.job{margin-top:6px;}div.job strong{font-size:11px;}div.job em{font-size:9.5px;color:#555;}ul{margin:2px 0;padding-left:18px;}li{font-size:10.5px;margin-bottom:1px;}p.skills{font-size:10px;margin:1px 0;}p.edu{font-size:10px;margin:2px 0;}@media print{body{margin:0.4in 0.5in;}}</style></head><body>';
    var inEdu = false;
    for (var i = 0; i < lines.length; i++) {
        var l = lines[i].trim();
        if (!l) continue;
        if (i === 0) { html += '<h1>' + escapeHtml(l) + '</h1>'; continue; }
        if (i <= 2 && (l.indexOf('|') !== -1 || l.indexOf('@') !== -1)) { html += '<p class="contact">' + escapeHtml(l) + '</p>'; continue; }
        if (l.match(/^[A-Z][A-Z &]+$/) && l.length > 3) { if (l.match(/EDUCATION/)) inEdu = true; else inEdu = false; html += '<h2>' + escapeHtml(l) + '</h2>'; continue; }
        var cleaned = escapeHtml(l).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
        if (l.startsWith('* ') || l.startsWith('- ')) { html += '<li>' + cleaned.substring(2) + '</li>'; continue; }
        if (l.match(/\|.*\d{4}/) && !inEdu) { html += '<div class="job"><strong>' + cleaned.split('|')[0] + '</strong> |' + cleaned.split('|').slice(1).join('|') + '</div>'; continue; }
        if (inEdu) { html += '<p class="edu">' + cleaned + '</p>'; continue; }
        html += '<p class="skills">' + cleaned + '</p>';
    }
    html += '</body></html>';
    var w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    setTimeout(function() { w.print(); }, 500);
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
    { name: 'Maria Gonzalez', contact: '469-555-0234 | mariag88@yahoo.com',
      beforeCustom: true,
      beforeHtml: '<div style="font-size:.7rem;font-weight:700;margin-bottom:.1rem;">Maria Gonzalez</div><div style="font-size:.48rem;color:#555;margin-bottom:.4rem;">469-555-0234 | mariag88@yahoo.com</div>'
        + '<div style="font-size:.5rem;font-weight:700;margin-bottom:.15rem;">OBJECTIVE</div>'
        + '<div style="font-size:.48rem;color:#666;margin-bottom:.3rem;font-style:italic;">Hardworking retail professional looking for a new opportunity where I can use my skills to help a team succeed and grow in my career.</div>'
        + '<div style="font-size:.5rem;font-weight:700;margin-bottom:.15rem;">WORK HISTORY</div>'
        + '<div style="font-size:.48rem;"><b>Store Manager</b> - Dollar General<br>Mesquite TX | 2019 - Present</div>'
        + '<div style="font-size:.45rem;color:#444;margin:.1rem 0 .05rem .5rem;">&#8226; Responsible for managing day to day store operations</div>'
        + '<div style="font-size:.45rem;color:#444;margin:.05rem 0 .05rem .5rem;">&#8226; Handle scheduling for a team of employees</div>'
        + '<div style="font-size:.45rem;color:#444;margin:.05rem 0 .05rem .5rem;">&#8226; Deal with customer complaints and resolve issues</div>'
        + '<div style="font-size:.45rem;color:#444;margin:.05rem 0 .05rem .5rem;">&#8226; Close out registers and prepare nightly deposits</div>'
        + '<div style="font-size:.45rem;color:#444;margin:.05rem 0 .2rem .5rem;">&#8226; Train new hires on store procedures</div>'
        + '<div style="font-size:.48rem;"><b>Cashier</b> - Walmart<br>Garland TX | 2016 - 2019</div>'
        + '<div style="font-size:.45rem;color:#444;margin:.1rem 0 .05rem .5rem;">&#8226; Worked the cash register</div>'
        + '<div style="font-size:.45rem;color:#444;margin:.05rem 0 .05rem .5rem;">&#8226; Stocked shelves</div>'
        + '<div style="font-size:.45rem;color:#444;margin:.05rem 0 .2rem .5rem;">&#8226; Helped customers find stuff</div>'
        + '<div style="font-size:.5rem;font-weight:700;margin-bottom:.15rem;">SKILLS</div>'
        + '<div style="font-size:.45rem;color:#444;">Customer Service, Cash Handling, Microsoft Word, Team Player, Hard Worker, Detail Oriented</div>'
        + '<div style="font-size:.5rem;font-weight:700;margin-top:.25rem;margin-bottom:.1rem;">EDUCATION</div>'
        + '<div style="font-size:.45rem;color:#444;">McKinney High School - Diploma, 2015</div>',
      afterSummary: 'Retail operations manager with 5+ years overseeing daily store operations, P&L reporting, and team development. Track record of training and retaining staff in a high-volume, fast-paced environment.',
      afterJobs: [
        { title: 'Store Manager', co: 'Dollar General, Mesquite TX', date: '2019 - Present', bullets: ['Managed daily operations for a <span class="dp-kw">high-volume retail location</span>, overseeing <span class="dp-kw">P&L reporting</span>, cash reconciliation, and deposit preparation', 'Recruited, scheduled, and <span class="dp-kw">developed a team</span> of ~10 associates, reducing turnover through structured onboarding and coaching', 'Resolved customer escalations and implemented <span class="dp-kw">service recovery processes</span>, maintaining store satisfaction scores above district average', 'Oversaw <span class="dp-kw">inventory management</span> and <span class="dp-kw">loss prevention</span>, conducting nightly audits and shrinkage reporting', 'Trained 30+ new hires over 5 years on POS systems, merchandising standards, and safety protocols'] },
        { title: 'Cashier', co: 'Walmart, Garland TX', date: '2016 - 2019', bullets: ['Processed ~200 transactions daily across register and self-checkout, maintaining accuracy and speed during peak hours', 'Managed shelf inventory and product displays for 3 departments, executing weekly <span class="dp-kw">planogram resets</span>', 'Assisted customers with product location and returns, averaging 95%+ satisfaction on post-transaction surveys'] }
      ],
      afterSkills: '<b>Operations:</b> P&L Reporting, Inventory Management, Loss Prevention, Scheduling<br><b>Leadership:</b> Team Development, Hiring, Training, Performance Coaching<br><b>Systems:</b> POS Systems, Planogram Management, Cash Handling',
      afterEdu: null,
      beforeScore: 23, afterScore: 87 },

    { name: 'James Chen', contact: 'jchen.dev@gmail.com | 972-555-3344 | github.com/jameschen',
      beforeCustom: true,
      beforeHtml: '<div style="text-align:center;margin-bottom:.3rem;"><div style="font-size:.8rem;font-weight:700;">James Chen</div><div style="font-size:.45rem;color:#555;">jchen.dev@gmail.com | 972-555-3344 | github.com/jameschen | Dallas, TX</div></div>'
        + '<div style="font-size:.5rem;font-weight:700;border-bottom:1px solid #ccc;margin:.3rem 0 .15rem;">Summary</div>'
        + '<div style="font-size:.46rem;color:#555;margin-bottom:.25rem;">Experienced software developer with skills in multiple programming languages and technologies. Strong problem solver with attention to detail.</div>'
        + '<div style="font-size:.5rem;font-weight:700;border-bottom:1px solid #ccc;margin:.3rem 0 .15rem;">Technical Skills</div>'
        + '<div style="font-size:.45rem;color:#444;margin-bottom:.25rem;">JavaScript, React, Node.js, PostgreSQL, Git, HTML/CSS, Problem Solving, Communication, Teamwork</div>'
        + '<div style="font-size:.5rem;font-weight:700;border-bottom:1px solid #ccc;margin:.3rem 0 .15rem;">Experience</div>'
        + '<div style="font-size:.48rem;margin-bottom:.05rem;"><b>Software Developer</b> | Acme Corp | Dallas, TX | Jan 2020 - Present</div>'
        + '<div style="font-size:.44rem;color:#444;margin:0 0 .03rem .4rem;">- Build and maintain web applications</div>'
        + '<div style="font-size:.44rem;color:#444;margin:0 0 .03rem .4rem;">- Write REST APIs in Node.js</div>'
        + '<div style="font-size:.44rem;color:#444;margin:0 0 .03rem .4rem;">- Manage PostgreSQL databases</div>'
        + '<div style="font-size:.44rem;color:#444;margin:0 0 .03rem .4rem;">- Participate in code reviews</div>'
        + '<div style="font-size:.44rem;color:#444;margin:0 0 .15rem .4rem;">- Fix bugs reported by QA team</div>'
        + '<div style="font-size:.48rem;margin-bottom:.05rem;"><b>Junior Developer</b> | Startup Inc | Austin, TX | Jun 2018 - Dec 2019</div>'
        + '<div style="font-size:.44rem;color:#444;margin:0 0 .03rem .4rem;">- Developed frontend features using HTML, CSS, JavaScript</div>'
        + '<div style="font-size:.44rem;color:#444;margin:0 0 .03rem .4rem;">- Fixed bugs and wrote unit tests</div>'
        + '<div style="font-size:.44rem;color:#444;margin:0 0 .15rem .4rem;">- Worked with the design team on new features</div>'
        + '<div style="font-size:.5rem;font-weight:700;border-bottom:1px solid #ccc;margin:.3rem 0 .15rem;">Education</div>'
        + '<div style="font-size:.45rem;color:#444;">BS Computer Science - University of Texas at Austin, 2018</div>',
      afterSummary: 'Full-stack engineer with 6+ years building production web applications in React, Node.js, and PostgreSQL. Experienced with CI/CD pipelines, microservices architecture, and agile development in cross-functional teams.',
      afterJobs: [
        { title: 'Software Developer', co: 'Acme Corp, Dallas TX', date: 'Jan 2020 - Present', bullets: ['Built and maintained <span class="dp-kw">React</span> and <span class="dp-kw">TypeScript</span> web applications serving 50K+ monthly active users across 3 product lines', 'Designed <span class="dp-kw">RESTful APIs</span> in <span class="dp-kw">Node.js</span> with <span class="dp-kw">PostgreSQL</span>, handling 10K+ daily transactions across microservices', 'Implemented <span class="dp-kw">CI/CD pipelines</span> using <span class="dp-kw">GitHub Actions</span>, reducing deployment cycles from 2 hours to 15 minutes', 'Conducted <span class="dp-kw">code reviews</span> for a team of 6 engineers, reducing production defects ~30% over 4 quarters', 'Optimized <span class="dp-kw">database queries</span> and caching layers, improving API response times by 40% for high-traffic endpoints'] },
        { title: 'Junior Developer', co: 'Startup Inc, Austin TX', date: 'Jun 2018 - Dec 2019', bullets: ['Developed responsive frontend features in <span class="dp-kw">JavaScript</span>, <span class="dp-kw">HTML/CSS</span>, and early React components for a B2B SaaS platform', 'Wrote 200+ <span class="dp-kw">unit tests</span> using Jest, increasing code coverage from 45% to 78% across 3 modules', 'Collaborated with design and product teams in <span class="dp-kw">Agile sprints</span> to ship 12 features over 18 months'] }
      ],
      afterSkills: '<b>Languages:</b> JavaScript, TypeScript, Python, SQL, HTML/CSS<br><b>Frameworks:</b> React, Node.js, Express, Next.js<br><b>Data:</b> PostgreSQL, Redis, MongoDB<br><b>DevOps:</b> GitHub Actions, Docker, CI/CD, AWS (EC2, S3)',
      afterEdu: 'BS Computer Science, UT Austin, 2018',
      beforeScore: 31, afterScore: 92 },

    { name: 'Tiffany Nguyen', contact: 'tiffnguyen@gmail.com | 817-555-9012',
      beforeCustom: true,
      beforeHtml: '<div style="text-align:right;font-size:.42rem;color:#555;margin-bottom:.2rem;">tiffnguyen@gmail.com<br>817-555-9012<br>Arlington, TX</div>'
        + '<div style="font-size:.75rem;font-weight:700;margin-bottom:.05rem;">Tiffany Nguyen</div>'
        + '<div style="font-size:.42rem;color:#888;font-style:italic;margin-bottom:.3rem;">New graduate nurse looking for my first RN position</div>'
        + '<div style="background:#f0f0f0;padding:.2rem .3rem;font-size:.45rem;font-weight:700;margin-bottom:.2rem;">CLINICAL EXPERIENCE</div>'
        + '<div style="font-size:.46rem;margin-bottom:.05rem;">Clinical Rotations - <em style="color:#666;">JPS Hospital, Fort Worth TX</em></div>'
        + '<div style="font-size:.42rem;color:#444;margin:0 0 .03rem .3rem;">Med-surg rotation (120 hours)</div>'
        + '<div style="font-size:.42rem;color:#444;margin:0 0 .03rem .3rem;">ICU rotation (60 hours)</div>'
        + '<div style="font-size:.42rem;color:#444;margin:0 0 .03rem .3rem;">OB rotation (40 hours)</div>'
        + '<div style="font-size:.42rem;color:#444;margin:0 0 .15rem .3rem;">Pediatrics rotation (40 hours)</div>'
        + '<div style="background:#f0f0f0;padding:.2rem .3rem;font-size:.45rem;font-weight:700;margin-bottom:.2rem;">WORK EXPERIENCE</div>'
        + '<div style="font-size:.46rem;">Certified Nursing Assistant</div>'
        + '<div style="font-size:.42rem;color:#666;margin-bottom:.05rem;">Brookdale Senior Living, Arlington TX | Jun 2022 - May 2024</div>'
        + '<div style="font-size:.42rem;color:#444;margin:0 0 .03rem .3rem;">&#8226; Took vital signs on patients</div>'
        + '<div style="font-size:.42rem;color:#444;margin:0 0 .03rem .3rem;">&#8226; Helped patients with bathing and eating</div>'
        + '<div style="font-size:.42rem;color:#444;margin:0 0 .15rem .3rem;">&#8226; Documented patient info in charts</div>'
        + '<div style="background:#f0f0f0;padding:.2rem .3rem;font-size:.45rem;font-weight:700;margin-bottom:.15rem;">SKILLS & CERTIFICATIONS</div>'
        + '<div style="font-size:.42rem;color:#444;">Patient Care | Vital Signs | CPR | Teamwork | Microsoft Office | Caring Personality</div>'
        + '<div style="font-size:.42rem;color:#444;margin-top:.05rem;">BLS Certified</div>'
        + '<div style="background:#f0f0f0;padding:.2rem .3rem;font-size:.45rem;font-weight:700;margin-top:.2rem;margin-bottom:.1rem;">EDUCATION</div>'
        + '<div style="font-size:.42rem;color:#444;">BSN Nursing - University of Texas at Arlington, May 2025</div>',
      afterSummary: 'BSN-prepared registered nurse with 2 years of direct patient care experience as a CNA and 260 hours of clinical rotations across Med-Surg, ICU, OB, and Pediatrics. BLS certified with strong assessment, documentation, and interdisciplinary communication skills.',
      afterJobs: [
        { title: 'Clinical Rotations', co: 'JPS Hospital, Fort Worth TX', date: 'Fall 2024 - Spring 2025', bullets: ['Completed 120 hours on a <span class="dp-kw">Medical-Surgical</span> unit, performing <span class="dp-kw">patient assessments</span>, medication administration, and wound care for 4-6 patients per shift', 'Completed 60 hours in <span class="dp-kw">ICU</span>, monitoring ventilators, IV drips, and hemodynamic status under preceptor guidance', 'Rotated through OB (40 hrs) and Pediatrics (40 hrs), gaining experience in <span class="dp-kw">family-centered care</span> and age-specific interventions'] },
        { title: 'Certified Nursing Assistant', co: 'Brookdale Senior Living, Arlington TX', date: 'Jun 2022 - May 2024', bullets: ['Monitored and recorded <span class="dp-kw">vital signs</span> for ~30 residents per shift, escalating abnormal findings to the nursing team', 'Delivered direct <span class="dp-kw">patient care</span> including bathing, mobility assistance, and meal support for a long-term care population', 'Documented patient status and care activities in <span class="dp-kw">electronic health records</span>, maintaining accurate and timely charting'] }
      ],
      afterSkills: '<b>Clinical:</b> Patient Assessment, Medication Administration, Wound Care, Vital Signs<br><b>Systems:</b> Electronic Health Records (Epic), BLS Certified<br><b>Soft Skills:</b> Patient Advocacy, Interdisciplinary Communication, Time Management',
      afterEdu: 'BSN Nursing, University of Texas at Arlington, May 2025',
      beforeScore: 19, afterScore: 84 }
];

var docIdx = 0;
var docEl = document.getElementById('docCompare');
function renderDocCompare() {
    if (!docEl) return;
    var ex = docExamples[docIdx];
    function buildAfterDoc(summary, jobs, skills, edu) {
        var h = '<div class="dp-name">' + ex.name.toUpperCase() + '</div>';
        h += '<div class="dp-contact">' + ex.contact + '</div>';
        h += '<div class="dp-section">PROFESSIONAL SUMMARY</div>';
        h += '<div style="font-size:.52rem;line-height:1.4;margin-bottom:.3rem;color:#1a1a1a;">' + summary + '</div>';
        h += '<div class="dp-section">PROFESSIONAL EXPERIENCE</div>';
        for (var j = 0; j < jobs.length; j++) {
            h += '<div class="dp-job"><strong>' + jobs[j].title + '</strong> | ' + jobs[j].co + '<br><em>' + jobs[j].date + '</em></div>';
            for (var b = 0; b < jobs[j].bullets.length; b++) {
                h += '<div class="dp-bullet">' + jobs[j].bullets[b] + '</div>';
            }
        }
        if (skills) { h += '<div class="dp-section">SKILLS</div><div style="font-size:.48rem;line-height:1.4;color:#333;">' + skills + '</div>'; }
        if (edu) { h += '<div class="dp-section">EDUCATION</div><div style="font-size:.48rem;color:#333;">' + edu + '</div>'; }
        return h;
    }
    var beforeContent = ex.beforeCustom ? ex.beforeHtml : '';
    docEl.innerHTML = '<div class="doc-col"><div class="doc-col-label">Before</div>'
        + '<div class="doc-preview" onclick="enlargeDoc(this)"><div class="enlarge-hint">Click to enlarge</div>' + beforeContent + '</div>'
        + '<div class="doc-score">' + ex.beforeScore + '% ATS match</div></div>'
        + '<div class="doc-col"><div class="doc-col-label">After ResumeGo</div>'
        + '<div class="doc-preview" onclick="enlargeDoc(this)"><div class="enlarge-hint">Click to enlarge</div>' + buildAfterDoc(ex.afterSummary, ex.afterJobs, ex.afterSkills, ex.afterEdu) + '</div>'
        + '<div class="doc-score">' + ex.afterScore + '% ATS match</div></div>';
    docEl.style.opacity = '0';
    setTimeout(function() { docEl.style.opacity = '1'; }, 50);
}
renderDocCompare();
setInterval(function() { docIdx = (docIdx + 1) % docExamples.length; renderDocCompare(); }, 8000);

function enlargeDoc(el) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:200;display:flex;align-items:center;justify-content:center;padding:1.5rem;cursor:pointer;overflow-y:auto;';
    var box = el.cloneNode(true);
    box.classList.add('doc-enlarged');
    box.style.cursor = 'default';
    box.onclick = function(e) { e.stopPropagation(); };
    var hint = box.querySelector('.enlarge-hint');
    if (hint) hint.remove();
    overlay.appendChild(box);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
}

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
