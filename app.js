var WEBHOOK_URL = 'https://n8n.myaibuffet.com/webhook/resume-tailor';

// Mobile menu
var mobileToggle = document.getElementById('mobileToggle');
if (mobileToggle) {
    mobileToggle.addEventListener('click', function() {
        document.querySelector('.nav-links').classList.toggle('open');
    });
}

// Price toggle
var coverCheck = document.getElementById('coverLetter');
var totalEl = document.getElementById('totalPrice');
if (coverCheck) {
    coverCheck.addEventListener('change', function() {
        totalEl.textContent = this.checked ? '$1.50' : '$1.00';
    });
}

// Character counts
var resumeText = document.getElementById('resumeText');
var jobText = document.getElementById('jobText');
var resumeCount = document.getElementById('resumeCount');
var jobCount = document.getElementById('jobCount');
if (resumeText && resumeCount) {
    resumeText.addEventListener('input', function() { resumeCount.textContent = this.value.length; });
}
if (jobText && jobCount) {
    jobText.addEventListener('input', function() { jobCount.textContent = this.value.length; });
}

// FAQ toggle
function toggleFaq(btn) {
    var item = btn.parentElement;
    var wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(function(el) { el.classList.remove('open'); });
    if (!wasOpen) item.classList.add('open');
}

// LinkedIn tabs
function switchLinkedInTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    document.querySelector('[data-tab="' + tab + '"]').classList.add('active');
    document.getElementById('linkedinUrlTab').style.display = tab === 'url' ? 'block' : 'none';
    document.getElementById('linkedinTextTab').style.display = tab === 'text' ? 'block' : 'none';
}

// Form submit
var form = document.getElementById('resumeForm');
if (form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        var resume = document.getElementById('resumeText').value.trim();
        var job = document.getElementById('jobText').value.trim();
        var wantCover = document.getElementById('coverLetter').checked;
        var btn = document.getElementById('submitBtn');

        if (!resume || resume.length < 100) {
            alert('Please paste your full resume (at least 100 characters).');
            return;
        }
        if (!job || job.length < 50) {
            alert('Please paste the full job description (at least 50 characters).');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span>Generating your resume...';

        fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: 'tailor',
                resume: resume,
                job_posting: job,
                include_cover_letter: wantCover,
                amount: wantCover ? 150 : 100
            })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.payment_url) {
                window.location.href = data.payment_url;
            } else if (data.resume_html) {
                showResult(data);
            } else if (data.error) {
                alert(data.error);
                resetBtn(btn);
            }
        })
        .catch(function() {
            alert('Something went wrong. Please try again.');
            resetBtn(btn);
        });
    });
}

function resetBtn(btn) {
    btn.disabled = false;
    btn.textContent = 'Pay & Generate Resume';
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
        html += '<details style="margin-top:1.5rem;"><summary style="cursor:pointer;font-weight:600;font-size:0.9rem;color:var(--text-light);">Preview resume text</summary>';
        html += '<div style="margin-top:1rem;padding:1.5rem;background:#fff;border:1px solid var(--border);border-radius:var(--radius);font-size:0.85rem;line-height:1.65;white-space:pre-wrap;">' + escapeHtml(data.resume_text) + '</div></details>';
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

// LinkedIn optimizer
function optimizeLinkedIn() {
    var btn = document.getElementById('linkedinBtn');
    var result = document.getElementById('linkedinResult');
    var urlTab = document.getElementById('linkedinUrlTab');
    var isUrl = urlTab.style.display !== 'none';

    var payload = { mode: 'linkedin' };

    if (isUrl) {
        var slug = document.getElementById('linkedinUrl').value.trim();
        if (!slug) {
            alert('Please enter your LinkedIn profile URL or username.');
            return;
        }
        slug = slug.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '').replace(/\/+$/, '');
        payload.linkedin_url = 'https://www.linkedin.com/in/' + slug;
    } else {
        var text = document.getElementById('linkedinInput').value.trim();
        if (!text || text.length < 50) {
            alert('Please paste your LinkedIn profile text (at least 50 characters).');
            return;
        }
        payload.linkedin_text = text;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Analyzing your profile...';
    result.style.display = 'none';

    fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.suggestions) {
            result.innerHTML = formatSuggestions(data.suggestions);
            result.style.display = 'block';
            result.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (data.error && data.error.indexOf('Paste Text') !== -1) {
            result.innerHTML = '<div style="text-align:center;padding:1rem;">'
                + '<p style="font-weight:600;margin-bottom:0.75rem;">LinkedIn blocks automated reading. Here is how to copy your profile:</p>'
                + '<ol style="text-align:left;max-width:400px;margin:0 auto 1rem;font-size:0.9rem;line-height:1.8;">'
                + '<li>Open your LinkedIn profile in a new tab</li>'
                + '<li>Scroll through your entire profile</li>'
                + '<li>Press Ctrl+A (select all) then Ctrl+C (copy)</li>'
                + '<li>Click the <strong>"Paste Text"</strong> tab above and paste it</li>'
                + '</ol>'
                + '<button class="btn btn-outline" onclick="switchLinkedInTab(\'text\');document.getElementById(\'linkedinInput\').focus();">Switch to Paste Text</button>'
                + '</div>';
            result.style.display = 'block';
            result.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (data.error) {
            alert(data.error);
        }
    })
    .catch(function() {
        alert('Something went wrong. Please try again.');
    })
    .finally(function() {
        btn.disabled = false;
        btn.textContent = 'Optimize My LinkedIn - Free';
    });
}

function formatSuggestions(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^### (.*$)/gm, '<h4 style="margin:1.25rem 0 0.5rem;font-size:1rem;color:var(--text);">$1</h4>')
        .replace(/^## (.*$)/gm, '<h3 style="margin:1.5rem 0 0.5rem;font-size:1.1rem;color:var(--text);">$1</h3>')
        .replace(/^- (.*$)/gm, '<div style="padding:0.2rem 0 0.2rem 1rem;position:relative;"><span style="position:absolute;left:0;color:var(--primary);">&#8226;</span>$1</div>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.querySelector('.nav-links').classList.remove('open');
        }
    });
});
