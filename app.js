var WEBHOOK_URL = 'https://n8n.myaibuffet.com/webhook/resume-tailor';

// Price toggle
var coverCheck = document.getElementById('coverLetter');
var totalEl = document.getElementById('totalPrice');
if (coverCheck) {
    coverCheck.addEventListener('change', function() {
        totalEl.textContent = this.checked ? '$1.50' : '$1.00';
    });
}

// Form submit
var form = document.getElementById('resumeForm');
if (form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        var resumeText = document.getElementById('resumeText').value.trim();
        var jobText = document.getElementById('jobText').value.trim();
        var wantCover = document.getElementById('coverLetter').checked;
        var btn = document.getElementById('submitBtn');

        if (!resumeText || resumeText.length < 100) {
            alert('Please paste your full resume (at least 100 characters).');
            return;
        }
        if (!jobText || jobText.length < 50) {
            alert('Please paste the full job description (at least 50 characters).');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span>Generating your resume...';

        fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resume: resumeText,
                job_posting: jobText,
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
                alert('Error: ' + data.error);
                btn.disabled = false;
                btn.textContent = 'Pay & Generate Resume';
            }
        })
        .catch(function(err) {
            alert('Something went wrong. Please try again.');
            btn.disabled = false;
            btn.textContent = 'Pay & Generate Resume';
        });
    });
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
        html += '<a href="' + data.cover_letter_pdf_url + '" target="_blank" class="btn download-btn" style="background:#059669">Download Cover Letter PDF</a>';
    }
    if (data.resume_html) {
        html += '<div style="margin-top:1.5rem; padding:1.5rem; background:#fff; border:1px solid #E2E8F0; border-radius:10px;">';
        html += '<h4 style="margin-bottom:1rem;">Preview</h4>';
        html += '<div style="font-size:0.85rem; line-height:1.6; white-space:pre-wrap;">' + data.resume_text + '</div>';
        html += '</div>';
    }

    content.innerHTML = html;
    area.style.display = 'block';
    area.scrollIntoView({ behavior: 'smooth' });
    btn.disabled = false;
    btn.textContent = 'Generate Another Resume';
}

// LinkedIn optimizer
function optimizeLinkedIn() {
    var input = document.getElementById('linkedinInput');
    var btn = document.getElementById('linkedinBtn');
    var result = document.getElementById('linkedinResult');
    var text = input.value.trim();

    if (!text || text.length < 50) {
        alert('Please paste your LinkedIn profile text (at least 50 characters).');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Analyzing your profile...';
    result.style.display = 'none';

    fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            mode: 'linkedin',
            linkedin_text: text
        })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.suggestions) {
            result.textContent = data.suggestions;
            result.style.display = 'block';
        } else if (data.error) {
            alert('Error: ' + data.error);
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
