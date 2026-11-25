<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{.FullName}} - Resume</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #2d3436; background: #f8f9fa; }
        .resume { max-width: 800px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 20px rgba(0,0,0,0.08); }
        .top-bar { height: 6px; background: linear-gradient(90deg, #6c5ce7, #a29bfe); }
        .content { padding: 40px; }
        .name { font-size: 2em; font-weight: 700; color: #2d3436; }
        .title { font-size: 1.1em; color: #6c5ce7; margin-top: 4px; }
        .contact-row { display: flex; gap: 20px; margin-top: 12px; font-size: 0.85em; color: #636e72; }
        .divider { height: 1px; background: #dfe6e9; margin: 25px 0; }
        h2 { font-size: 0.85em; text-transform: uppercase; letter-spacing: 2px; color: #6c5ce7; margin-bottom: 12px; }
        .summary-text { line-height: 1.7; color: #636e72; }
        .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .skill { background: #f0efff; color: #6c5ce7; padding: 4px 10px; border-radius: 20px; font-size: 0.8em; }
        .job { margin-bottom: 18px; }
        .job-title { font-weight: 600; font-size: 1em; }
        .job-meta { font-size: 0.85em; color: #b2bec3; margin: 2px 0 6px; }
        .job-desc { font-size: 0.9em; line-height: 1.6; color: #636e72; }
        .edu { margin-bottom: 8px; }
        .edu-degree { font-weight: 600; }
        .edu-meta { font-size: 0.85em; color: #b2bec3; }
    </style>
</head>
<body>
    <div class="resume">
        <div class="top-bar"></div>
        <div class="content">
            <div class="name">{{.FullName}}</div>
            <div class="title">{{.Title}}</div>
            <div class="contact-row">
                <span>{{.Email}}</span>
                <span>{{.Phone}}</span>
            </div>

            <div class="divider"></div>
            <h2>About</h2>
            <p class="summary-text">{{.Summary}}</p>

            <div class="divider"></div>
            <h2>Skills</h2>
            <div class="skills-grid">
                {{range .Skills}}<span class="skill">{{.}}</span>{{end}}
            </div>

            <div class="divider"></div>
            <h2>Experience</h2>
            {{range .Experience}}
            <div class="job">
                <div class="job-title">{{.Role}}</div>
                <div class="job-meta">{{.Company}} &middot; {{.Duration}}</div>
                <div class="job-desc">{{.Details}}</div>
            </div>
            {{end}}

            <div class="divider"></div>
            <h2>Education</h2>
            {{range .Education}}
            <div class="edu">
                <span class="edu-degree">{{.Degree}}</span>
                <div class="edu-meta">{{.Institution}} &middot; {{.Year}}</div>
            </div>
            {{end}}
        </div>
    </div>
</body>
</html>
