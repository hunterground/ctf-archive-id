<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{.FullName}} - Resume</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Helvetica, Arial, sans-serif; background: #1a1a2e; color: #eee; }
        .resume { max-width: 850px; margin: 0 auto; display: grid; grid-template-columns: 260px 1fr; min-height: 100vh; }
        .sidebar { background: #16213e; padding: 40px 25px; }
        .sidebar h1 { font-size: 1.5em; color: #e94560; }
        .sidebar .title { color: #aaa; font-size: 0.9em; margin-top: 4px; }
        .sidebar .contact { margin-top: 20px; font-size: 0.85em; color: #888; line-height: 2; }
        .sidebar h2 { font-size: 0.8em; text-transform: uppercase; letter-spacing: 2px; color: #e94560; margin: 25px 0 10px; }
        .skill-item { font-size: 0.85em; color: #ccc; padding: 3px 0; }
        .main-content { padding: 40px 30px; }
        .section { margin-bottom: 28px; }
        .section h2 { font-size: 1em; color: #e94560; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #2a2a4a; }
        .summary { color: #bbb; line-height: 1.7; }
        .exp-item { margin-bottom: 18px; }
        .exp-item h3 { font-size: 1em; color: #eee; }
        .exp-item .meta { color: #888; font-size: 0.85em; margin: 2px 0 6px; }
        .exp-item p { color: #aaa; line-height: 1.6; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="resume">
        <div class="sidebar">
            <h1>{{.FullName}}</h1>
            <div class="title">{{.Title}}</div>
            <div class="contact">
                <div>{{.Email}}</div>
                <div>{{.Phone}}</div>
            </div>
            <h2>Skills</h2>
            {{range .Skills}}
            <div class="skill-item">{{.}}</div>
            {{end}}
        </div>
        <div class="main-content">
            <div class="section">
                <h2>About Me</h2>
                <p class="summary">{{.Summary}}</p>
            </div>
            <div class="section">
                <h2>Experience</h2>
                {{range .Experience}}
                <div class="exp-item">
                    <h3>{{.Role}}</h3>
                    <div class="meta">{{.Company}} | {{.Duration}}</div>
                    <p>{{.Details}}</p>
                </div>
                {{end}}
            </div>
            <div class="section">
                <h2>Education</h2>
                {{range .Education}}
                <div class="exp-item">
                    <h3>{{.Degree}}</h3>
                    <div class="meta">{{.Institution}} | {{.Year}}</div>
                </div>
                {{end}}
            </div>
        </div>
    </div>
</body>
</html>
