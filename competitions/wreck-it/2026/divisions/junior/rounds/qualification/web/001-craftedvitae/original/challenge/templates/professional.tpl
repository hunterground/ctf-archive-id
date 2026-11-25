<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{.FullName}} - Resume</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: {{.ThemeConfig.FontFamily}}; color: #1a1a2e; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
        .header { border-bottom: 3px solid {{.ThemeConfig.PrimaryColor}}; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { font-size: 2.2em; color: {{.ThemeConfig.PrimaryColor}}; }
        .header .title { font-size: 1.1em; color: #555; margin-top: 5px; }
        .contact { display: flex; gap: 20px; margin-top: 10px; font-size: 0.9em; color: #666; }
        .section { margin-bottom: 25px; }
        .section h2 { font-size: 1.3em; color: {{.ThemeConfig.PrimaryColor}}; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; margin-bottom: 15px; }
        .summary { line-height: 1.6; color: #444; }
        .skills { display: flex; flex-wrap: wrap; gap: 8px; }
        .skill-tag { background: {{.ThemeConfig.PrimaryColor}}15; color: {{.ThemeConfig.PrimaryColor}}; padding: 4px 12px; border-radius: 4px; font-size: 0.85em; }
        .experience-item { margin-bottom: 20px; }
        .experience-item h3 { font-size: 1.05em; }
        .experience-item .meta { color: #888; font-size: 0.9em; margin: 3px 0 8px; }
        .experience-item p { line-height: 1.5; color: #444; }
        .education-item { margin-bottom: 10px; }
        .education-item h3 { font-size: 1em; }
        .education-item .meta { color: #888; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{.FullName}}</h1>
        <div class="title">{{.Title}}</div>
        <div class="contact">
            <span>{{.Email}}</span>
            <span>{{.Phone}}</span>
        </div>
    </div>

    <div class="section">
        <h2>Summary</h2>
        <p class="summary">{{.Summary}}</p>
    </div>

    <div class="section">
        <h2>Skills</h2>
        <div class="skills">
            {{range .Skills}}<span class="skill-tag">{{.}}</span>{{end}}
        </div>
    </div>

    <div class="section">
        <h2>Experience</h2>
        {{range .Experience}}
        <div class="experience-item">
            <h3>{{.Role}}</h3>
            <div class="meta">{{.Company}} | {{.Duration}}</div>
            <p>{{.Details}}</p>
        </div>
        {{end}}
    </div>

    <div class="section">
        <h2>Education</h2>
        {{range .Education}}
        <div class="education-item">
            <h3>{{.Degree}}</h3>
            <div class="meta">{{.Institution}} | {{.Year}}</div>
        </div>
        {{end}}
    </div>
</body>
</html>
