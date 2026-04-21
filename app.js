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
        if (val.match(/^https?:\/\//i) || val.match(/linkedin\.com|indeed\.com|glassdoor\.com/i)) {
            jobHint.textContent = 'Paste the job description text, not the URL. Open the posting and copy the text.';
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
        if (job.match(/^https?:\/\//i)) {
            alert('Please paste the job description text, not a URL. Open the job posting and copy the text.');
            return;
        }
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
                    alert('Could not read your file. Please use the "Paste Text" tab instead.');
                    resetBtn(btn);
                    return;
                }
                btn.innerHTML = '<span class="spinner"></span>Tailoring your resume...';
                sendPayload({ resume: text, job_posting: job, include_cover_letter: wantCover }, btn);
            }).catch(function() {
                alert('Could not read your file. Please use the "Paste Text" tab instead.');
                resetBtn(btn);
            });
        }
    });
}

function extractTextFromFile(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() {
            var arrayBuffer = reader.result;
            if (file.name.match(/\.pdf$/i) && window.pdfjsLib) {
                var loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                loadingTask.promise.then(function(pdf) {
                    var pages = [];
                    var done = 0;
                    for (var i = 1; i <= pdf.numPages; i++) {
                        (function(pageNum) {
                            pdf.getPage(pageNum).then(function(page) {
                                page.getTextContent().then(function(content) {
                                    var text = content.items.map(function(item) { return item.str; }).join(' ');
                                    pages[pageNum - 1] = text;
                                    done++;
                                    if (done === pdf.numPages) {
                                        resolve(pages.join('\n\n'));
                                    }
                                });
                            });
                        })(i);
                    }
                }).catch(reject);
            } else if (file.name.match(/\.docx?$/i) && window.mammoth) {
                mammoth.extractRawText({ arrayBuffer: arrayBuffer }).then(function(result) {
                    var text = (result.value || '').trim();
                    if (text.length > 50) resolve(text);
                    else reject(new Error('Could not read Word document'));
                }).catch(reject);
            } else {
                reject(new Error('Unsupported file type'));
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

    var html = '';
    if (data.resume_pdf_url) {
        html += '<a href="' + data.resume_pdf_url + '" target="_blank" class="btn download-btn">Download Resume PDF</a>';
    }
    if (data.cover_letter_pdf_url) {
        html += '<a href="' + data.cover_letter_pdf_url + '" target="_blank" class="btn download-btn" style="background:var(--green)">Download Cover Letter</a>';
    }
    if (data.resume_text) {
        html += '<details style="margin-top:1.25rem;"><summary style="cursor:pointer;font-weight:600;font-size:.85rem;color:var(--text-dim);">Preview resume text</summary>';
        html += '<div style="margin-top:.75rem;padding:1.25rem;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);font-size:.82rem;line-height:1.65;white-space:pre-wrap;">' + escapeHtml(data.resume_text) + '</div></details>';
    }
    content.innerHTML = html;
    area.style.display = 'block';
    area.scrollIntoView({ behavior: 'smooth' });
    resetBtn(btn);
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
var baExamples = [
    {
        role: 'Registered Nurse', company: 'Memorial Hospital',
        before: ['Took care of patients in the ICU', 'Gave medications and did assessments', 'Worked with doctors on treatment plans'],
        afterRole: 'ICU Registered Nurse',
        after: ['Delivered <em>critical care</em> to 4-6 <em>ICU patients</em> per shift, monitoring <em>ventilators</em>, <em>IV drips</em>, and <em>hemodynamic</em> status', 'Administered <em>high-risk medications</em> following <em>evidence-based protocols</em>, maintaining zero medication errors over 18 months', 'Collaborated with <em>interdisciplinary care teams</em> on <em>treatment planning</em> and <em>patient discharge coordination</em>'],
        beforeScore: 31, afterScore: 89
    },
    {
        role: 'Marketing Coordinator', company: 'BrightPath Agency',
        before: ['Managed social media accounts', 'Helped with email campaigns', 'Created content for the website'],
        afterRole: 'Digital Marketing Coordinator',
        after: ['Managed <em>social media strategy</em> across 4 platforms, growing <em>organic engagement</em> by coordinating <em>content calendars</em> and <em>A/B testing</em>', 'Executed <em>email marketing campaigns</em> using <em>HubSpot</em>, segmenting audiences and optimizing <em>open rates</em> and <em>click-through rates</em>', 'Produced <em>SEO-optimized content</em> including blog posts, landing pages, and <em>lead magnets</em> aligned with <em>brand guidelines</em>'],
        beforeScore: 24, afterScore: 87
    },
    {
        role: 'Project Manager', company: 'BuildRight Construction',
        before: ['Managed construction projects', 'Kept track of budgets and schedules', 'Worked with subcontractors'],
        afterRole: 'Senior Project Manager',
        after: ['Managed <em>commercial construction projects</em> valued at $2-5M, delivering within <em>budget</em> and <em>schedule constraints</em>', 'Tracked <em>project budgets</em>, <em>change orders</em>, and <em>cost forecasting</em> using <em>Procore</em> and <em>MS Project</em>', 'Coordinated 8-12 <em>subcontractor teams</em>, conducting <em>site inspections</em> and enforcing <em>OSHA safety compliance</em>'],
        beforeScore: 28, afterScore: 91
    },
    {
        role: 'Accountant', company: 'Greenfield Financial',
        before: ['Did monthly financial reports', 'Helped with tax preparation', 'Reconciled accounts'],
        afterRole: 'Staff Accountant',
        after: ['Prepared <em>monthly financial statements</em> and <em>variance analysis</em> for management review in compliance with <em>GAAP</em>', 'Supported <em>tax preparation</em> and <em>year-end close</em> processes, coordinating with external <em>CPA firms</em> on <em>audit documentation</em>', 'Performed <em>account reconciliations</em> across 50+ <em>general ledger accounts</em>, resolving discrepancies within 48 hours'],
        beforeScore: 22, afterScore: 85
    },
    {
        role: 'Software Developer', company: 'Acme Corp',
        before: ['Built web applications', 'Wrote APIs', 'Fixed bugs and did code reviews'],
        afterRole: 'Full Stack Developer',
        after: ['Developed <em>React</em> and <em>TypeScript</em> web applications serving production traffic with <em>CI/CD pipelines</em>', 'Designed and implemented <em>RESTful APIs</em> using <em>Node.js</em> and <em>PostgreSQL</em>, following <em>microservices architecture</em>', 'Conducted <em>code reviews</em> and <em>pair programming</em>, improving <em>code quality</em> and reducing <em>production incidents</em>'],
        beforeScore: 33, afterScore: 92
    },
    {
        role: 'Teacher', company: 'Lincoln Elementary',
        before: ['Taught 3rd grade students', 'Created lesson plans', 'Met with parents about student progress'],
        afterRole: 'Elementary Educator',
        after: ['Designed and delivered <em>differentiated instruction</em> for 24 <em>diverse learners</em>, integrating <em>STEM activities</em> and <em>project-based learning</em>', 'Developed <em>standards-aligned lesson plans</em> using <em>backward design</em> framework, incorporating <em>formative assessments</em> and <em>data-driven instruction</em>', 'Facilitated <em>parent-teacher conferences</em> and maintained ongoing <em>family engagement</em> through <em>progress monitoring</em> and <em>intervention plans</em>'],
        beforeScore: 26, afterScore: 88
    }
];

var baIndex = 0;
var baGrid = document.getElementById('baGrid');
function renderBaExample() {
    if (!baGrid) return;
    var ex = baExamples[baIndex];
    baGrid.innerHTML = '<div class="ba-card ba-before">'
        + '<div class="ba-tag ba-tag-red">What you sent</div>'
        + '<div class="ba-line"><strong>' + ex.role + '</strong> <span>' + ex.company + '</span></div>'
        + '<ul>' + ex.before.map(function(b) { return '<li>' + b + '</li>'; }).join('') + '</ul>'
        + '<div class="ba-score ba-score-red"><span class="ba-pct">' + ex.beforeScore + '%</span> ATS match</div>'
        + '</div>'
        + '<div class="ba-card ba-after">'
        + '<div class="ba-tag ba-tag-green">After ResumeGo</div>'
        + '<div class="ba-line"><strong>' + ex.afterRole + '</strong> <span>' + ex.company + '</span></div>'
        + '<ul>' + ex.after.map(function(b) { return '<li>' + b + '</li>'; }).join('') + '</ul>'
        + '<div class="ba-score ba-score-green"><span class="ba-pct">' + ex.afterScore + '%</span> ATS match</div>'
        + '</div>';
    baGrid.style.opacity = '0';
    setTimeout(function() { baGrid.style.opacity = '1'; }, 50);
}
renderBaExample();
setInterval(function() {
    baIndex = (baIndex + 1) % baExamples.length;
    renderBaExample();
}, 5000);

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
