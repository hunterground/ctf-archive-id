<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{.FullName}} - Resume</title>
    <style>
        body { font-family: Georgia, serif; max-width: 700px; margin: 50px auto; padding: 0 20px; color: #333; line-height: 1.6; }
        h1 { font-size: 1.8em; font-weight: normal; margin-bottom: 0; }
        .title { color: #888; font-style: italic; }
        .contact { color: #888; font-size: 0.9em; margin: 8px 0 30px; }
        hr { border: none; border-top: 1px solid #ddd; margin: 25px 0; }
        h2 { font-size: 1em; text-transform: uppercase; letter-spacing: 2px; color: #999; margin-bottom: 12px; }
        .skills { color: #555; }
        .exp h3 { font-weight: normal; font-size: 1em; }
        .exp .meta { color: #999; font-size: 0.85em; }
        .exp p { margin: 5px 0 15px; color: #555; }
    </style>
</head>
<body>
    <h1>{{.FullName}}</h1>
    <div class="title">{{.Title}}</div>
    <div class="contact">{{.Email}} | {{.Phone}}</div>
    <hr>
    <h2>Summary</h2>
    <p>{{.Summary}}</p>
    <hr>
    <h2>Skills</h2>
    <p class="skills">{{.FormatSkills}}</p>
    <hr>
    <h2>Experience</h2>
    {{range .Experience}}
    <div class="exp">
        <h3>{{.Role}} at {{.Company}}</h3>
        <div class="meta">{{.Duration}}</div>
        <p>{{.Details}}</p>
    </div>
    {{end}}
    <hr>
    <h2>Education</h2>
    {{range .Education}}
    <div class="exp">
        <h3>{{.Degree}}</h3>
        <div class="meta">{{.Institution}}, {{.Year}}</div>
    </div>
    {{end}}
</body>
</html>
