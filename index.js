var Module = require('module');
var path = require('path');
var fs = require('fs');

var addCoverage = exports.addCoverage = function (code, filename) {
    var lines = code.split('\n');

    if (lines.length > 0) {
        lines[0] = 'if (!__cov["' + filename + '"]) {__cov["' + filename + '"] = { 0: true}; }' + lines[0];
    }

    for (var i = 0; i < lines.length; i++) {
        if (lines[i].match(/^\s\*\s/)) continue;
        var name = '__cov["' + filename + '"][' + i + ']';
        var covLine = ' ' + name + ' = (' + name + ' || 0) + 1;';
        lines[i] = lines[i]
        .replace(/;$/, ';' + covLine)
        .replace(/^\s*(return|throw|break|continue)/, covLine + ' $1');
    }

    return lines.join('\n');
};

exports.init = function init(subdir) {
    if (process.env.NOCOV || global.__cov) return;
    if (!subdir) {
        subdir = process.cwd();
    } else if (!subdir.match(/^\//)) {
        subdir = path.join(process.cwd(), subdir);
    }
    global.__cov = {};
    var compile = Module.prototype._compile;
    Module.prototype._compile = function (code, filename) {
        if (~filename.indexOf(subdir)) {
            code = addCoverage(code, filename);
        }
        return compile.call(this, code, filename);
    };
};

exports.report = function () {
    if (process.env.NOCOV) return;
    coverageReport();
};

function coverageReport() {
    var cwd = process.cwd(),
    total_lines = 0,
    total_covered = 0,
    files = [];

    for (file in __cov) {
        if (file.search(cwd) === -1 || file.search(cwd + '/node_modules') !== -1) continue;
        var shortFileName = file.replace(cwd + '/', '');
        var id = shortFileName.replace(/[^a-z]+/gi, '-').replace(/^-|-$/, '');
        var code = fs.readFileSync(file).toString().split('\n');
        var cnt = code.filter(function (line) {
            return line.match(/;$/) && !line.match(/^\s\*\s/);
        }).length;
        var covered = Object.keys(__cov[file]).length;
        if (covered > cnt) covered = cnt;
        var coveredPercentage = cnt === 0 ? 100 : Math.round((covered / cnt) * 100);
        total_covered += covered;
        total_lines += cnt;
        var html = '<div class="file"><a href="#' + id + '" class="filename" name="' + id +
        '" onclick="var el = document.getElementById(\'' + id +
        '\'); el.style.display = el.style.display ? \'\' : \'none\';">' + shortFileName +
        '</a> <div class="gauge" style="width: ' + (3 * coveredPercentage) +
        'px"><strong>' + coveredPercentage + '%</strong> [' + cnt + ' to cover, ' +
        code.length + ' total]</div></div>\n';

        html += '<div id="' + id + '" style="display:none;">';
        code.forEach(function (line, i) {
            html += '<pre class="' + (__cov[file][i] ? 'covered' : (line.match(/;$/) && !line.match(/ \* /) ? 'uncovered' : '')) + '">' + i + '. ' + line + '</pre>\n';
        });
        html += '</div>';

        if (cnt > 1) {
            files.push({
                lines: cnt,
                covered: covered,
                id: id,
                name: shortFileName,
                html: html
            });
        }
    }

    var html = files.sort(function (x, y) {
        return y.lines - x.lines;
    }).map(function (f) { return f.html }).join('\n');

    fs.writeFileSync(cwd + '/coverage.html', fs.readFileSync(path.join(__dirname, 'coverage.html')).toString().replace('CODE', html));
    console.log('====================');
    console.log('TOTAL COVERAGE:', Math.round((total_covered / (total_lines)) * 100) + '%');
}
